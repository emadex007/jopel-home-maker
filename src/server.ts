// Worker entry: serves R2 media, handles visitor photo uploads and inbound email,
// and passes everything else to TanStack Start.
import handler from "@tanstack/react-start/server-entry";
import PostalMime from "postal-mime";
import type { AppEnv } from "~/lib/env";
import { SESSION_COOKIE, getStaffByToken, readCookie } from "~/server/auth";
import { rememberOrigin } from "~/server/db";

const MAX_UPLOAD = 8 * 1024 * 1024; // 8 MB per visitor photo
const MAX_ADMIN_UPLOAD = 15 * 1024 * 1024; // 15 MB per dashboard upload
const ADMIN_EXTRA_TYPES: Record<string, string> = { "image/x-icon": "ico", "image/vnd.microsoft.icon": "ico", "image/gif": "gif" };
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
  headers.set("X-Content-Type-Options", "nosniff");
  if (!("body" in obj) || !obj.body) return new Response(null, { status: 304, headers });
  return new Response(obj.body, { headers });
}

/**
 * Photo uploads. Public visitors (quote requests) go to uploads/, max 8 MB.
 * Logged-in staff (dashboard) go to library/, max 15 MB, and may also upload .ico favicons.
 */
async function handleUpload(request: Request, env: AppEnv, admin: boolean) {
  const limit = admin ? MAX_ADMIN_UPLOAD : MAX_UPLOAD;
  const limitMb = Math.round(limit / 1024 / 1024);
  const len = Number(request.headers.get("content-length") || 0);
  if (len > limit + 64 * 1024) return json({ error: `Photo is too large (max ${limitMb} MB).` }, 413);
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return json({ error: "Invalid upload." }, 400);
  }
  const file = form.get("file");
  if (!(file instanceof File)) return json({ error: "No file received." }, 400);
  const ext = IMAGE_TYPES[file.type] ?? (admin ? ADMIN_EXTRA_TYPES[file.type] : undefined);
  if (!ext) return json({ error: "Please upload a JPG, PNG, WEBP or HEIC photo." }, 415);
  if (file.size > limit) return json({ error: `Photo is too large (max ${limitMb} MB).` }, 413);

  const d = new Date();
  const key = `${admin ? "library" : "uploads"}/${d.getUTCFullYear()}/${String(d.getUTCMonth() + 1).padStart(2, "0")}/${crypto.randomUUID()}.${ext}`;
  await env.MEDIA.put(key, file.stream(), { httpMetadata: { contentType: file.type } });
  return json({ url: `/media/${key}` });
}

const STATIC_PAGES = ["/", "/about", "/services", "/portfolio", "/book", "/quote", "/contact"];

function robotsTxt(origin: string) {
  return new Response(
    `User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /q/\nDisallow: /api/\n\nSitemap: ${origin}/sitemap.xml\n`,
    { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=3600" } },
  );
}

async function sitemapXml(origin: string, env: AppEnv) {
  let projects: { slug: string; updated_at: string }[] = [];
  try {
    const { results } = await env.DB.prepare("SELECT slug, updated_at FROM projects WHERE published = 1 ORDER BY sort_order, id DESC").all<{
      slug: string;
      updated_at: string;
    }>();
    projects = results ?? [];
  } catch {
    /* database not ready yet: list the main pages only */
  }
  const esc = (u: string) => u.replace(/&/g, "&amp;").replace(/</g, "&lt;");
  const urls = [
    ...STATIC_PAGES.map((p) => `<url><loc>${esc(origin + p)}</loc><changefreq>weekly</changefreq><priority>${p === "/" ? "1.0" : "0.8"}</priority></url>`),
    ...projects.map(
      (p) =>
        `<url><loc>${esc(`${origin}/portfolio/${encodeURIComponent(p.slug)}`)}</loc>${p.updated_at ? `<lastmod>${p.updated_at.slice(0, 10)}</lastmod>` : ""}<changefreq>monthly</changefreq><priority>0.7</priority></url>`,
    ),
  ];
  return new Response(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>\n`, {
    headers: { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "public, max-age=3600" },
  });
}

export default {
  async fetch(request: Request, env: AppEnv, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    rememberOrigin(url.origin); // used for links and images in notification emails

    if (url.pathname === "/robots.txt") return robotsTxt(url.origin);
    if (url.pathname === "/sitemap.xml") return sitemapXml(url.origin, env);

    if (url.pathname.startsWith("/media/") && (request.method === "GET" || request.method === "HEAD")) {
      return serveMedia(request, env, decodeURIComponent(url.pathname.slice("/media/".length)));
    }
    if (url.pathname === "/api/upload" && request.method === "POST") {
      return handleUpload(request, env, false);
    }
    if (url.pathname === "/api/admin/upload" && request.method === "POST") {
      const staff = await getStaffByToken(readCookie(request, SESSION_COOKIE));
      if (!staff) return json({ error: "Please log in again." }, 401);
      return handleUpload(request, env, true);
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
