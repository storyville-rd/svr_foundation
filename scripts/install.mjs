#!/usr/bin/env node
// Installs a svr_brand release into an app, identically every time. Zero dependencies; Node 18+.
// Run it from the app's root folder (npm scripts do).
//
//   node install.mjs <tag> <dest> [--public <dir>] [--docs <dir>] [--repo owner/name] [--commit <sha>] [--from <checkout>]
//   node install.mjs --check  [<dest>] [--public <dir>] [--docs <dir>] [--remote]
//   node install.mjs --latest [<dest>] [--repo owner/name]
//
//   <tag>     a release tag, e.g. v3.3.1
//   <dest>    where the release goes in the app, e.g. vendor/svr_brand. Default for --check/--latest: vendor/svr_brand
//   --public  also copy the files the browser must load as-is (js/theme.js, icons/) into this folder, e.g. public/svr.
//             Vite bundles the CSS and fonts; it does not bundle these.
//   --docs    also install the brand docs (BRAND.md, ACCESSIBILITY.md, EMAIL.md, component docs, CLAUDE-snippet.md, README,
//             CHANGELOG, INSTALL) into this folder, e.g. docs/brand, so people and Claude can read them inside the app.
//   --repo    default storyville-rd/svr_brand
//   --commit  install this exact commit instead of looking the tag up through the GitHub API (or when rate-limited)
//   --from    install from a local checkout of svr_brand instead of GitHub (bootstrap, offline, testing)
//   --check   verify an installed copy against its manifest, and that git isn't ignoring any of it; exits 1 on any
//             problem. --public/--docs default to the folders recorded at install time.
//   --remote  with --check: also fetch manifest.json at the installed commit from GitHub and verify against that, which
//             catches edits to both the files and the local manifest.
//   --latest  print the newest release tag and whether the installed copy is behind
//
// GITHUB_TOKEN raises the GitHub API rate limit (60 requests/hour without it; an install or --latest uses one).
//
// How an install works:
//   1. Resolve the tag to a commit SHA; download manifest.json and every release file at that commit into a staging
//      folder in the system temp directory, checking each file's size and sha256. Nothing in the app is touched yet.
//   2. Back up the current copy (to the temp directory), then write the new files into the existing folders file by file
//      and delete files the release no longer has. Folders are never renamed: on Windows, renaming a folder that an
//      editor, file watcher or antivirus has just looked at fails with EPERM, while writing files inside it works.
//      Locked files are retried for a few seconds.
//   3. Verify the result against the manifest. If anything fails, put the backup back and report what happened.
//   4. Warn if git ignores any installed file (e.g. a "dist" rule in .gitignore), since a fresh clone wouldn't have it.
import { createHash } from 'node:crypto';
import { mkdir, writeFile, readFile, rm, readdir, stat, rmdir, mkdtemp } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { dirname, join, resolve, relative, sep } from 'node:path';

// Release files an app installs (including this script, so `npm run brand:install` can run it from the installed copy).
const INSTALL = [/^VERSION$/, /^dist\//, /^fonts\//, /^js\//, /^icons\//, /^logos\//, /^react\//, /^components\/(storyville\.global\.js|index\.d\.ts)$/, /^scripts\/install\.mjs$/];
const PUBLIC = [/^js\/theme\.js$/, /^icons\//];
const DOCS = [/^docs\//, /^README\.md$/, /^CHANGELOG\.md$/, /^INSTALL\.md$/];
const RECORD = 'INSTALLED.json';
// Written into every folder the installer owns, so git never rewrites line endings there (Windows core.autocrlf).
const GITATTRIBUTES = '# Written by the svr_brand installer: keep these files byte-for-byte identical to the release.\n* -text\n';
const LOCK_CODES = ['EBUSY', 'EPERM', 'EACCES', 'ENOTEMPTY'];

class Fail extends Error {}
const fail = (msg) => { throw new Fail(msg); };
const sha256 = (buf) => createHash('sha256').update(buf).digest('hex');
const wanted = (path, set) => set.some((re) => re.test(path));
const rel = (p) => relative('.', p).split(sep).join('/') || '.';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const readJson = async (p) => { try { return JSON.parse(await readFile(p, 'utf8')); } catch { return null; } };
const semver = (t) => (String(t).replace(/^v/, '').match(/^(\d+)\.(\d+)\.(\d+)$/) || []).slice(1).map(Number);
const newer = (a, b) => { const x = semver(a), y = semver(b); for (let i = 0; i < 3; i++) if (x[i] !== y[i]) return x[i] > y[i]; return false; };

async function walk(dir, base = dir) {
  const out = [];
  let names;
  try { names = await readdir(dir); } catch (e) { if (e.code === 'ENOENT') return out; throw e; }
  for (const n of names) {
    const p = join(dir, n);
    if ((await stat(p)).isDirectory()) out.push(...(await walk(p, base))); else out.push(relative(base, p).split(sep).join('/'));
  }
  return out;
}

async function http(url, accept) {
  const headers = { 'User-Agent': 'svr_brand-install' };
  if (accept) headers.Accept = accept;
  if (process.env.GITHUB_TOKEN && url.startsWith('https://api.github.com/')) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  let res;
  try { res = await fetch(url, { headers }); } catch (e) { fail(`can't reach ${new URL(url).host}: ${e.cause?.code || e.message}`); }
  if (!res.ok) {
    await res.arrayBuffer().catch(() => {});
    fail(`${res.status} ${res.statusText} for ${url}${res.status === 403 || res.status === 429 ? ' (rate-limited? set GITHUB_TOKEN, or pass --commit)' : res.status === 401 ? ' (GITHUB_TOKEN is set but invalid or expired: fix or unset it)' : ''}`);
  }
  return Buffer.from(await res.arrayBuffer());
}

// Windows can briefly lock files (an editor, a file watcher, antivirus). Retry those for ~8 seconds; fail on anything else.
async function retry(fn, what) {
  for (let i = 0; ; i++) {
    try { return await fn(); } catch (e) {
      if (!LOCK_CODES.includes(e.code) || i >= 11) {
        const err = new Error(`${what}: ${e.code || e.message}`);
        err.code = e.code; throw err;
      }
      await sleep(120 * (i + 1));
    }
  }
}

// Compare a file with its manifest entry; explain line-ending-only differences.
function compare(buf, f) {
  if (buf.length === f.bytes && sha256(buf) === f.sha256) return null;
  const lf = Buffer.from(buf.toString('latin1').replace(/\r\n/g, '\n'), 'latin1');
  if (lf.length === f.bytes && sha256(lf) === f.sha256) return 'crlf';
  return 'changed';
}

// ---------- git: is anything we installed ignored? ----------
function gitRoot(dir) {
  try { return execFileSync('git', ['rev-parse', '--show-toplevel'], { cwd: dir, stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim(); }
  catch { return null; } // not a repo, or git isn't installed
}
// Returns [{ path, source, line, pattern, fix }] for files git would leave out of a commit.
function gitIgnored(absPaths) {
  if (!absPaths.length) return [];
  const root = gitRoot(dirname(absPaths[0]));
  if (!root) return [];
  const relPaths = absPaths.map((p) => relative(root, p).split(sep).join('/'));
  let out = '';
  try {
    out = execFileSync('git', ['check-ignore', '-v', '-n', '--stdin'], { cwd: root, input: relPaths.join('\n') + '\n', stdio: ['pipe', 'pipe', 'ignore'] }).toString();
  } catch (e) { out = e.stdout ? e.stdout.toString() : ''; } // exit 1 = nothing ignored
  const hits = [];
  for (const lineText of out.split('\n')) {
    const m = lineText.match(/^(.*?):(\d+):(.*?)\t(.*)$/);
    if (!m || !m[1]) continue; // "::\tpath" = not ignored
    const [, source, line, pattern, path] = m;
    // Suggest re-including the folder the rule matched (e.g. "dist" → "!/vendor/svr_brand/dist/").
    const name = pattern.replace(/^\//, '').replace(/\/$/, '');
    const parts = path.split('/');
    const i = parts.findIndex((seg, k) => k < parts.length - 1 && seg === name);
    const fix = i >= 0 ? `!/${parts.slice(0, i + 1).join('/')}/` : null;
    hits.push({ path, source, line, pattern, fix });
  }
  return hits;
}
function describeIgnored(hits) {
  const rules = [...new Map(hits.map((h) => [`${h.source}:${h.line}`, h])).values()];
  const fixes = [...new Set(hits.map((h) => h.fix).filter(Boolean))];
  let msg = `git is ignoring ${hits.length} installed file(s), so a fresh clone (or a CI build) won't have them:\n`;
  msg += hits.slice(0, 6).map((h) => `  ${h.path}`).join('\n') + (hits.length > 6 ? `\n  …and ${hits.length - 6} more` : '') + '\n';
  msg += `Ignored by: ${rules.map((h) => `${h.source} line ${h.line} ("${h.pattern}")`).join('; ')}\n`;
  if (fixes.length) msg += `Fix: add ${fixes.length > 1 ? 'these lines' : 'this line'} to the repo's root .gitignore (after that rule), then commit the files:\n${fixes.map((f) => `  ${f}`).join('\n')}`;
  else msg += 'Fix: change that rule so it no longer matches the install folders (git can\'t re-include a file inside an ignored parent folder), then commit the files.';
  return msg;
}

// ---------- verify an installed copy ----------
async function verify(dest, publicDir, docsDir, manifest) {
  const problems = [];
  let crlf = false;
  const checked = [];
  for (const [root, set, on] of [[dest, INSTALL, true], [publicDir, PUBLIC, !!publicDir], [docsDir, DOCS, !!docsDir]]) {
    if (!on) continue;
    const expect = manifest.files.filter((f) => wanted(f.path, set));
    for (const f of expect) {
      const p = join(root, f.path);
      let buf;
      try { buf = await readFile(p); } catch { problems.push(`missing: ${rel(p)}`); continue; }
      checked.push(p);
      const why = compare(buf, f);
      if (why === 'crlf') { crlf = true; problems.push(`differs only in line endings (git autocrlf): ${rel(p)}`); }
      else if (why) problems.push(`changed: ${rel(p)}`);
    }
    // The installer owns dest and docsDir completely, so anything else there is extra. The public folder may be shared.
    if (root !== publicDir) {
      const known = new Set([...expect.map((f) => f.path), '.gitattributes', ...(root === dest ? ['manifest.json', RECORD] : [])]);
      for (const p of await walk(root)) if (!known.has(p)) problems.push(`extra: ${rel(join(root, p))}`);
    }
  }
  return { problems, crlf, checked };
}

// ---------- write a staged tree into a folder, file by file ----------
// owned = the installer owns the whole folder (delete anything not in `files`); otherwise only touch `files`.
async function applyTree(srcRoot, target, files, owned) {
  for (const p of files) {
    const src = await readFile(join(srcRoot, p));
    const dst = join(target, p);
    const cur = await readFile(dst).catch(() => null);
    if (cur && cur.equals(src)) continue; // unchanged: don't touch it (a locked, unchanged file is fine)
    await retry(() => mkdir(dirname(dst), { recursive: true }), `can't create ${rel(dirname(dst))}`);
    await retry(() => writeFile(dst, src), `can't write ${rel(dst)}`);
  }
  if (!owned) return;
  const keep = new Set(files);
  for (const p of await walk(target)) if (!keep.has(p)) await retry(() => rm(join(target, p), { force: true }), `can't delete ${rel(join(target, p))}`);
  await pruneEmpty(target);
}
async function pruneEmpty(dir) {
  let names;
  try { names = await readdir(dir); } catch { return; }
  for (const n of names) { const p = join(dir, n); if ((await stat(p)).isDirectory()) { await pruneEmpty(p); await rmdir(p).catch(() => {}); } }
}

// ---------- modes ----------
async function latest(args, repo) {
  const dest = resolve(args[0] || 'vendor/svr_brand');
  const rec = await readJson(join(dest, RECORD));
  let page = 1, best = null;
  for (;;) {
    const tags = JSON.parse((await http(`https://api.github.com/repos/${repo}/tags?per_page=100&page=${page}`, 'application/vnd.github+json')).toString('utf8'));
    for (const t of tags) if (semver(t.name).length === 3 && (!best || newer(t.name, best))) best = t.name;
    if (tags.length < 100) break;
    page++;
  }
  if (!best) fail(`no release tags found in ${repo}`);
  if (!rec) console.log(`Latest svr_brand release: ${best}. Nothing installed in ${rel(dest)} yet.`);
  else if (newer(best, rec.tag)) {
    console.log(`svr_brand is behind: ${rel(dest)} has ${rec.tag}; the latest release is ${best}.`);
    console.log(`Update: change the tag in the app's brand:install script to ${best}, run it, and read CHANGELOG.md for anything to change.`);
  } else console.log(`svr_brand is up to date: ${rel(dest)} has ${rec.tag}, the latest release.`);
}

async function check(args, opts) {
  const dest = resolve(args[0] || 'vendor/svr_brand');
  const rec = (await readJson(join(dest, RECORD))) || {};
  const pub = opts.pub || rec.public, docs = opts.docs || rec.docs;
  const localBuf = await readFile(join(dest, 'manifest.json')).catch(() => fail(`no manifest.json in ${rel(dest)}; is svr_brand installed there?`));
  let manifest = JSON.parse(localBuf.toString('utf8'));
  const problems = [];
  if (opts.remote) {
    const repo = rec.repo || opts.repo;
    if (!rec.commit || rec.commit === 'local') fail(`--remote needs the commit recorded in ${RECORD}; this copy was installed from a local checkout`);
    const remoteBuf = await http(`https://raw.githubusercontent.com/${repo}/${rec.commit}/manifest.json`);
    if (!remoteBuf.equals(localBuf)) problems.push(`changed: ${rel(join(dest, 'manifest.json'))} (differs from the release at ${repo}@${String(rec.commit).slice(0, 12)})`);
    manifest = JSON.parse(remoteBuf.toString('utf8')); // verify the files against the release's own manifest
  }
  const res = await verify(dest, pub && resolve(pub), docs && resolve(docs), manifest);
  problems.push(...res.problems);
  const ignored = gitIgnored(res.checked.concat([join(dest, 'manifest.json'), join(dest, RECORD)]));
  if (ignored.length) problems.push(...ignored.map((h) => `ignored by git (${h.source}:${h.line} "${h.pattern}"): ${h.path}`));
  if (problems.length) {
    console.error(`svr_brand ${manifest.version} in ${rel(dest)}: ${problems.length} problem(s)\n  ${problems.join('\n  ')}`);
    if (res.crlf) console.error(`\nLine-ending fix (Windows): git rewrote these files with CRLF. Reinstall (the installer writes a .gitattributes with "* -text" into its folders), or add to the app's .gitattributes:\n  ${rel(dest)}/** -text${pub ? `\n  ${rel(resolve(pub))}/** -text` : ''}${docs ? `\n  ${rel(resolve(docs))}/** -text` : ''}\nthen run: git add --renormalize . && npm run brand:install`);
    if (ignored.length) console.error('\n' + describeIgnored(ignored));
    process.exitCode = 1;
    return;
  }
  console.log(`svr_brand ${manifest.version} in ${rel(dest)} matches ${opts.remote ? 'the release manifest on GitHub' : 'its manifest'}${rec.commit ? ` (${rec.tag} @ ${String(rec.commit).slice(0, 12)})` : ''}.`);
}

async function install(args, opts) {
  const [tag, destArg] = args;
  if (!tag || !destArg) fail('usage: install.mjs <tag> <dest> [--public <dir>] [--docs <dir>] [--repo owner/name] [--commit <sha>] [--from <checkout>]');
  if (!semver(tag).length) fail(`"${tag}" isn't a release tag like v3.3.1`);
  const dest = resolve(destArg);
  const pubDir = opts.pub && resolve(opts.pub);
  const docsDir = opts.docs && resolve(opts.docs);
  for (const d of [pubDir, docsDir]) if (d && (d === dest || d.startsWith(dest + sep))) fail(`--public/--docs must be outside ${destArg}`);

  let commit = opts.commit;
  let fetchFile;
  if (opts.from) {
    fetchFile = (p) => readFile(join(resolve(opts.from), p));
    commit = commit || 'local';
  } else {
    if (!commit) commit = (await http(`https://api.github.com/repos/${opts.repo}/commits/${encodeURIComponent(tag)}`, 'application/vnd.github.sha')).toString('utf8').trim();
    if (!opts.commit && !/^[0-9a-f]{7,40}$/.test(commit)) fail(`couldn't resolve ${tag} to a commit (got "${commit.slice(0, 40)}")`);
    fetchFile = (p) => http(`https://raw.githubusercontent.com/${opts.repo}/${commit}/${p.split('/').map(encodeURIComponent).join('/')}`);
  }

  const manifestBuf = await fetchFile('manifest.json').catch((e) => fail(`can't read manifest.json: ${e.message}`));
  const manifest = JSON.parse(manifestBuf.toString('utf8'));
  if (manifest.version !== tag.replace(/^v/, '')) fail(`manifest at ${tag} says version ${manifest.version}; refusing to install a mismatched release`);
  for (const f of manifest.files) if (f.path.includes('..') || f.path.startsWith('/') || f.path.includes('\\')) fail(`unsafe path in manifest: ${f.path}`);

  // 1. Stage everything in the temp directory and check it. The app isn't touched until this passes.
  const work = await mkdtemp(join(tmpdir(), 'svr_brand-'));
  const targets = [];
  try {
    const record = { name: 'svr_brand', repo: opts.repo, tag, version: manifest.version, commit, public: pubDir ? rel(pubDir) : undefined, docs: docsDir ? rel(docsDir) : undefined, installedAt: new Date().toISOString() };
    const stageGroup = async (name, set, root, owned, extra) => {
      const stage = join(work, 'new', name);
      const files = manifest.files.filter((f) => wanted(f.path, set));
      for (const f of files) {
        const buf = await fetchFile(f.path);
        if (compare(buf, f)) fail(`${f.path} doesn't match the manifest (corrupted download?). Nothing was changed.`);
        await mkdir(dirname(join(stage, f.path)), { recursive: true });
        await writeFile(join(stage, f.path), buf);
      }
      await mkdir(stage, { recursive: true });
      for (const [n, content] of Object.entries(extra)) await writeFile(join(stage, n), content);
      targets.push({ name, root, owned, stage, files: [...files.map((f) => f.path), ...Object.keys(extra)] });
    };
    await stageGroup('dest', INSTALL, dest, true, { 'manifest.json': manifestBuf, [RECORD]: JSON.stringify(record, null, 2) + '\n', '.gitattributes': GITATTRIBUTES });
    if (docsDir) await stageGroup('docs', DOCS, docsDir, true, { '.gitattributes': GITATTRIBUTES });
    if (pubDir) await stageGroup('public', PUBLIC, pubDir, false, { '.gitattributes': GITATTRIBUTES });

    // 2. Back up what's there now, to the temp directory.
    for (const t of targets) {
      t.backup = join(work, 'old', t.name);
      t.existed = !!(await stat(t.root).catch(() => null));
      t.oldFiles = t.owned ? await walk(t.root) : (await Promise.all(t.files.map(async (p) => ((await stat(join(t.root, p)).catch(() => null)) ? p : null)))).filter(Boolean);
      for (const p of t.oldFiles) {
        await mkdir(dirname(join(t.backup, p)), { recursive: true });
        await writeFile(join(t.backup, p), await readFile(join(t.root, p)));
      }
    }

    // 3. Write the new files in place, then verify. On any failure, restore the backup.
    try {
      for (const t of targets) await applyTree(t.stage, t.root, t.files, t.owned);
      const { problems } = await verify(dest, pubDir, docsDir, manifest);
      if (problems.length) fail(`the installed files didn't verify:\n  ${problems.join('\n  ')}`);
    } catch (e) {
      const restoreErrors = [];
      for (const t of targets) {
        try {
          if (t.owned && !t.existed) await rm(t.root, { recursive: true, force: true });
          else {
            await applyTree(t.backup, t.root, t.oldFiles, t.owned);
            if (!t.owned) for (const p of t.files) if (!t.oldFiles.includes(p)) await rm(join(t.root, p), { force: true });
          }
        } catch (re) { restoreErrors.push(re.message); }
      }
      const locked = LOCK_CODES.includes(e.code);
      let msg = `install failed: ${e.message}\n`;
      msg += restoreErrors.length
        ? `The previous copy could NOT be fully restored (${restoreErrors.join('; ')}). Run the same install again once nothing has the files open.`
        : 'The previous copy was restored; nothing in the app changed.';
      if (locked) msg += '\nThe installer writes files in place (it never renames folders) and retried for ~8 seconds, but another program kept the file locked. Stop the dev server, close editors or terminals using that folder (or pause antivirus scanning of the project), then run it again.';
      fail(msg);
    }
  } finally {
    await rm(work, { recursive: true, force: true }).catch(() => {});
  }

  console.log(`Installed svr_brand ${manifest.version} (${tag} @ ${String(commit).slice(0, 12)}) into ${destArg}: ${manifest.files.filter((f) => wanted(f.path, INSTALL)).length} files${opts.pub ? `; theme.js and icons in ${opts.pub}` : ''}${opts.docs ? `; docs in ${opts.docs}` : ''}.`);

  // 4. Warn about anything git would leave out of a commit.
  const written = targets.flatMap((t) => t.files.map((p) => join(t.root, p)));
  const ignored = gitIgnored(written);
  if (ignored.length) console.warn('\nWarning: ' + describeIgnored(ignored));
}

// ---------- main: never call process.exit() (it can crash Node on Windows while fetch connections close) ----------
async function main() {
  const args = process.argv.slice(2);
  const flag = (name) => { const i = args.indexOf(name); if (i < 0) return undefined; const v = args[i + 1]; args.splice(i, 2); return v; };
  const has = (name) => { const i = args.indexOf(name); if (i < 0) return false; args.splice(i, 1); return true; };
  const mode = has('--check') ? 'check' : has('--latest') ? 'latest' : 'install';
  const opts = { remote: has('--remote'), repo: flag('--repo') || 'storyville-rd/svr_brand', commit: flag('--commit'), from: flag('--from'), pub: flag('--public'), docs: flag('--docs') };
  if (!/^[\w.-]+\/[\w.-]+$/.test(opts.repo)) fail(`bad --repo "${opts.repo}"`);
  if (mode === 'latest') return latest(args, opts.repo);
  if (mode === 'check') return check(args, opts);
  return install(args, opts);
}

main().catch((e) => {
  console.error(`svr_brand install: ${e instanceof Fail || e.code ? e.message : e.stack || e.message}`);
  process.exitCode = 1;
});
