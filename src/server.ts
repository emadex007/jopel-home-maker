// Worker entry: serves R2 media, handles visitor photo uploads and inbound email,
// and passes everything else to TanStack Start.
import handler from "@tanstack/react-start/server-entry";
import PostalMime from "postal-mime";
import type { AppEnv } from "~/lib/env";

const MAX_UPLOAD = 8 * 1024 * 1024; // 8 MB per photo
const IMAGE_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/heic": "heic",
  "image/heif": "heif",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

async function serveMedia(request: Request, env: AppEnv, key: string) {
  if (!key || key.includes("..")) return new Response("Not found", { status: 404 });
  const obj = await env.MEDIA.get(key, { onlyIf: request.headers, range: request.headers });
  if (!obj) return new Response("Not found", { status: 404 });
  const headers = new Headers();
  obj.writeHttpMetadata(headers);
  headers.set("etag", obj.httpEtag);
  headers.set("Cache-Control", "public, max-age=31536000, immutable");
  if (!("body" in obj) || !obj.body) return new Response(null, { status: 304, headers });
  return new Response(obj.body, { headers });
}

/** Public upload for quote-request photos only. Admin uploads come in Phase 2 behind login. */
async function handleUpload(request: Request, env: AppEnv) {
  const len = Number(request.headers.get("content-length") || 0);
  if (len > MAX_UPLOAD + 64 * 1024) return json({ error: "Photo is too large (max 8 MB)." }, 413);
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return json({ error: "Invalid upload." }, 400);
  }
  const file = form.get("file");
  if (!(file instanceof File)) return json({ error: "No file received." }, 400);
  const ext = IMAGE_TYPES[file.type];
  if (!ext) return json({ error: "Please upload a JPG, PNG, WEBP or HEIC photo." }, 415);
  if (file.size > MAX_UPLOAD) return json({ error: "Photo is too large (max 8 MB)." }, 413);

  const d = new Date();
  const key = `uploads/${d.getUTCFullYear()}/${String(d.getUTCMonth() + 1).padStart(2, "0")}/${crypto.randomUUID()}.${ext}`;
  await env.MEDIA.put(key, file.stream(), { httpMetadata: { contentType: file.type } });
  return json({ url: `/media/${key}` });
}

export default {
  async fetch(request: Request, env: AppEnv, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname.startsWith("/media/") && (request.method === "GET" || request.method === "HEAD")) {
      return serveMedia(request, env, decodeURIComponent(url.pathname.slice("/media/".length)));
    }
    if (url.pathname === "/api/upload" && request.method === "POST") {
      return handleUpload(request, env);
    }

    return (handler as { fetch: (r: Request, e?: unknown, c?: unknown) => Promise<Response> }).fetch(request, env, ctx);
  },

  /**
   * Emails sent to the business address (via Cloudflare Email Routing → "Send to a Worker")
   * land in the dashboard inbox. Optionally forwarded to ADMIN_NOTIFY_EMAIL too.
   */
  async email(message: ForwardableEmailMessage, env: AppEnv, _ctx: ExecutionContext) {
    try {
      const raw = await new Response(message.raw).arrayBuffer();
      const parsed = await PostalMime.parse(raw);
      const body = (parsed.text || (parsed.html ?? "").replace(/<[^>]+>/g, " ")).trim().slice(0, 20000);
      await env.DB.prepare(
        "INSERT INTO messages (source, name, email, subject, body) VALUES ('email', ?, ?, ?, ?)",
      )
        .bind(parsed.from?.name || "", parsed.from?.address || message.from, (parsed.subject || "").slice(0, 300), body)
        .run();
    } catch (err) {
      console.error("email handler failed", err);
    }
    if (env.ADMIN_NOTIFY_EMAIL) {
      try {
        await message.forward(env.ADMIN_NOTIFY_EMAIL);
      } catch (err) {
        console.error("forward failed", err);
      }
    }
  },
};
