import { drain } from "./drain";
import { handleIngest } from "./ingest";
import type { Env } from "./types";
// esbuild bundles this as text (see wrangler.toml [[rules]] and widget/build.mjs).
import widgetSource from "../widget/dist/w.js.txt";

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/w.js" && request.method === "GET") {
      return new Response(widgetSource, {
        headers: {
          "Content-Type": "application/javascript",
          "Cache-Control": "public, max-age=300",
        },
      });
    }

    if (url.pathname === "/health" && request.method === "GET") {
      const { results } = await env.DB.prepare(
        "SELECT COUNT(*) as count FROM reports WHERE status = 'pending'"
      ).all<{ count: number }>();
      return json({ ok: true, pending: results[0]?.count ?? 0 });
    }

    const match = url.pathname.match(/^\/r\/([^/]+)$/);
    if (match) {
      return handleIngest(request, env, match[1]);
    }

    return json({ ok: false, error: "not found" }, 404);
  },

  async scheduled(_event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    ctx.waitUntil(drain(env));
  },
};
