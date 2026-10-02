// Server-only data access. Imported by server functions (src/lib/api.ts) and src/server.ts.
import { env } from "~/lib/env";
import { mergeSettings, SETTINGS_KEYS, type SettingsKey, type SiteSettings } from "~/lib/site-defaults";

export type Service = {
  id: number;
  slug: string;
  title: string;
  summary: string;
  description: string;
  image: string;
};

export type ProjectSummary = {
  id: number;
  slug: string;
  title: string;
  category: string;
  location: string;
  year: string;
  summary: string;
  cover_image: string;
  featured: number;
  photo_count: number;
};

export type ProjectPhoto = { id: number; url: string; caption: string };

export type Project = ProjectSummary & {
  duration: string;
  scope: string;
  description: string;
  photos: ProjectPhoto[];
};

export type Testimonial = { id: number; name: string; role: string; quote: string };

export type Client = { id: number; name: string; logo: string; url: string };

export type Faq = { id: number; question: string; answer: string };

// ---------- settings ----------

export async function loadSettings(): Promise<SiteSettings> {
  try {
    const { results } = await env.DB.prepare("SELECT key, value FROM settings").all<{ key: string; value: string }>();
    const saved: Partial<Record<SettingsKey, unknown>> = {};
    for (const row of results ?? []) {
      if ((SETTINGS_KEYS as string[]).includes(row.key)) {
        try {
          saved[row.key as SettingsKey] = JSON.parse(row.value);
        } catch {
          /* ignore a bad row, defaults cover it */
        }
      }
    }
    return mergeSettings(saved);
  } catch (err) {
    // Table missing (migrations not applied yet): still render with defaults.
    console.error("loadSettings failed", err);
    return mergeSettings({});
  }
}

// ---------- content ----------

const PROJECT_SUMMARY_COLS = `p.id, p.slug, p.title, p.category, p.location, p.year, p.summary, p.cover_image, p.featured,
  (SELECT COUNT(*) FROM project_photos ph WHERE ph.project_id = p.id) AS photo_count`;

export async function listServices(): Promise<Service[]> {
  const { results } = await env.DB.prepare(
    "SELECT id, slug, title, summary, description, image FROM services WHERE active = 1 ORDER BY sort_order, id",
  ).all<Service>();
  return results ?? [];
}

export async function listProjects(opts: { featuredOnly?: boolean; limit?: number } = {}): Promise<ProjectSummary[]> {
  const where = opts.featuredOnly ? "AND p.featured = 1" : "";
  const limit = opts.limit ? `LIMIT ${Math.max(1, Math.floor(opts.limit))}` : "";
  const { results } = await env.DB.prepare(
    `SELECT ${PROJECT_SUMMARY_COLS} FROM projects p WHERE p.published = 1 ${where}
     ORDER BY p.sort_order, p.id DESC ${limit}`,
  ).all<ProjectSummary>();
  return results ?? [];
}

export async function getProjectBySlug(slug: string): Promise<{ project: Project; prev: ProjectSummary | null; next: ProjectSummary | null } | null> {
  const project = await env.DB.prepare(
    `SELECT ${PROJECT_SUMMARY_COLS}, p.duration, p.scope, p.description, p.sort_order
     FROM projects p WHERE p.slug = ? AND p.published = 1`,
  )
    .bind(slug)
    .first<Project & { sort_order: number }>();
  if (!project) return null;

  const { results: photos } = await env.DB.prepare(
    "SELECT id, url, caption FROM project_photos WHERE project_id = ? ORDER BY sort_order, id",
  )
    .bind(project.id)
    .all<ProjectPhoto>();

  // Neighbours in the same order as the portfolio grid.
  const all = await listProjects();
  const idx = all.findIndex((p) => p.id === project.id);
  const prev = idx > 0 ? all[idx - 1] : null;
  const next = idx >= 0 && idx < all.length - 1 ? all[idx + 1] : null;

  const { sort_order: _ignored, ...rest } = project;
  const gallery = photos ?? [];
  if (gallery.length === 0 && project.cover_image) {
    gallery.push({ id: 0, url: project.cover_image, caption: "" });
  }
  return { project: { ...rest, photos: gallery }, prev, next };
}

export async function listTestimonials(): Promise<Testimonial[]> {
  const { results } = await env.DB.prepare(
    "SELECT id, name, role, quote FROM testimonials WHERE active = 1 ORDER BY sort_order, id",
  ).all<Testimonial>();
  return results ?? [];
}

export async function listClients(): Promise<Client[]> {
  try {
    const { results } = await env.DB.prepare(
      "SELECT id, name, logo, url FROM clients WHERE active = 1 AND logo != '' ORDER BY sort_order, id",
    ).all<Client>();
    return results ?? [];
  } catch {
    return []; // table missing until migration 0004 is applied
  }
}

export async function listFaqs(): Promise<Faq[]> {
  try {
    const { results } = await env.DB.prepare("SELECT id, question, answer FROM faqs WHERE active = 1 ORDER BY sort_order, id").all<Faq>();
    return results ?? [];
  } catch {
    return []; // table missing until migration 0005 is applied
  }
}

// ---------- inquiries ----------

export function makeRef(prefix: string) {
  const d = new Date();
  const ymd = `${String(d.getUTCFullYear()).slice(2)}${String(d.getUTCMonth() + 1).padStart(2, "0")}${String(d.getUTCDate()).padStart(2, "0")}`;
  const rand = crypto.getRandomValues(new Uint32Array(1))[0].toString(36).toUpperCase().slice(0, 4).padStart(4, "0");
  return `${prefix}-${ymd}-${rand}`;
}

// ---------- email ----------

/** The site's public address (e.g. https://my-site.xyz.workers.dev), remembered from incoming requests. */
let siteOrigin = "";
export function rememberOrigin(origin: string) {
  if (origin && !/localhost|127\.0\.0\.1/.test(origin)) siteOrigin = origin;
  else if (!siteOrigin) siteOrigin = origin;
}
export const getSiteOrigin = () => siteOrigin;

const absolute = (url: string) => (!url ? "" : /^https?:\/\//.test(url) ? url : siteOrigin ? siteOrigin + url : "");
const safeColor = (c: string, fallback: string) => (/^#[0-9a-fA-F]{3,8}$/.test(c || "") ? c : fallback);

/** Wraps email content in the business's branding: coloured header with logo, white card, footer with contact details. */
export function emailLayout(s: SiteSettings, inner: string, opts: { button?: { label: string; href: string }; preheader?: string } = {}) {
  const primary = safeColor(s.theme.primary, "#1f1b18");
  const onPrimary = safeColor(s.theme.onPrimary, "#faf7f2");
  const accent = safeColor(s.theme.accent, "#b08d57");
  const bg = safeColor(s.theme.background, "#faf7f2");
  // Email apps can't recolour a logo, so use the white version on the dark header if there is one.
  const logo = absolute(s.brand.logoWhiteUrl || "");
  const brand = logo
    ? `<img src="${escapeHtml(logo)}" alt="${escapeHtml(s.brand.name)}" height="44" style="height:44px;width:auto;display:block;border:0">`
    : `<span style="font-family:Georgia,serif;font-size:24px;color:${onPrimary}">${escapeHtml(s.brand.name)}</span>`;
  const button = opts.button
    ? `<p style="margin:28px 0 8px"><a href="${escapeHtml(opts.button.href)}" style="display:inline-block;background:${primary};color:${onPrimary};padding:13px 26px;text-decoration:none;border-radius:4px;font-weight:bold;font-size:14px">${escapeHtml(opts.button.label)}</a></p>`
    : "";
  const contact = [s.contact.phone, s.contact.email].filter(Boolean).map(escapeHtml).join(" &nbsp;·&nbsp; ");
  return `<!doctype html><html><body style="margin:0;padding:0;background:${bg}">
<span style="display:none;max-height:0;overflow:hidden;opacity:0">${escapeHtml(opts.preheader || "")}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${bg};padding:24px 12px">
<tr><td align="center">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:6px;overflow:hidden">
    <tr><td style="background:${primary};padding:22px 28px">${brand}
      ${s.brand.tagline ? `<div style="font-family:Georgia,serif;font-style:italic;font-size:13px;color:${onPrimary};opacity:.75;margin-top:4px">${escapeHtml(s.brand.tagline)}</div>` : ""}</td></tr>
    <tr><td style="height:3px;background:${accent};font-size:0;line-height:0">&nbsp;</td></tr>
    <tr><td style="padding:30px 28px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.6;color:#1f1b18">${inner}${button}</td></tr>
    <tr><td style="padding:18px 28px;background:#f6f3ee;font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#6b645c;line-height:1.6">
      <b style="color:#1f1b18">${escapeHtml(s.brand.name)}</b>${s.contact.address ? `<br>${escapeHtml(s.contact.address).replace(/\n/g, "<br>")}` : ""}${contact ? `<br>${contact}` : ""}
    </td></tr>
  </table>
</td></tr></table></body></html>`;
}

/** Key/value table used in notifications. */
export function emailTable(lines: [string, string][]) {
  const rows = lines
    .filter(([, v]) => v)
    .map(
      ([k, v]) =>
        `<tr><td style="padding:8px 14px 8px 0;color:#6b645c;vertical-align:top;white-space:nowrap;border-bottom:1px solid #eee7dc">${escapeHtml(k)}</td><td style="padding:8px 0;white-space:pre-wrap;border-bottom:1px solid #eee7dc">${escapeHtml(v)}</td></tr>`,
    )
    .join("");
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;font-size:14px">${rows}</table>`;
}

/** Sends a notification email to the business through Resend if RESEND_API_KEY is set. Never throws. */
export async function notifyAdmin(subject: string, lines: [string, string][], replyTo?: string) {
  try {
    if (!env.RESEND_API_KEY) return;
    const settings = await loadSettings();
    const to = env.ADMIN_NOTIFY_EMAIL || settings.contact.email;
    if (!to) return;
    const inner = `<h1 style="font-family:Georgia,serif;font-weight:normal;font-size:24px;margin:0 0 18px">${escapeHtml(subject)}</h1>${emailTable(lines)}`;
    const html = emailLayout(settings, inner, {
      preheader: subject,
      button: siteOrigin ? { label: "Open dashboard", href: `${siteOrigin}/admin` } : undefined,
    });
    await sendEmail({ to, subject, html, replyTo });
  } catch (err) {
    console.error("notifyAdmin failed", err);
  }
}

/** Sends an email through Resend. Returns false (never throws) if email isn't set up or fails. */
export async function sendEmail(opts: { to: string; subject: string; html: string; replyTo?: string }): Promise<boolean> {
  try {
    if (!env.RESEND_API_KEY || !opts.to) return false;
    const settings = await loadSettings();
    const from = env.RESEND_FROM || `${settings.brand.name} <onboarding@resend.dev>`;
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to: [opts.to], subject: opts.subject, html: opts.html, ...(opts.replyTo ? { reply_to: opts.replyTo } : {}) }),
    });
    if (!res.ok) console.error("Resend error", res.status, await res.text());
    return res.ok;
  } catch (err) {
    console.error("sendEmail failed", err);
    return false;
  }
}

export const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
