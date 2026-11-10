import { build } from "esbuild";
import { mkdir, stat, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const dir = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(dir, "dist");
const outFile = path.join(outDir, "w.js.txt");

await mkdir(outDir, { recursive: true });

const result = await build({
  // Single source of truth: the widget lives in the brand part of this repo (components/bug-report.js).
  // This Worker re-serves a minified copy at /w.js for apps still using the legacy embed.
  entryPoints: [path.join(dir, "..", "..", "components", "bug-report.js")],
  bundle: false,
  minify: true,
  format: "iife",
  target: "es2018",
  write: false,
});

const code = result.outputFiles[0].text;
// Written with a .txt extension so wrangler's Text module rule picks it up as a plain
// string import in src/index.ts, rather than trying to parse it as another Worker module.
await writeFile(outFile, code, "utf8");

const { size } = await stat(outFile);
const kb = (size / 1024).toFixed(2);
console.log(`widget built: ${outFile} (${kb} KB)`);
if (size > 16 * 1024) {
  console.warn(`warning: widget exceeds the 16KB target (${kb} KB)`);
}
