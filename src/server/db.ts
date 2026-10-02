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

// ---------- inquiries ----------

export function makeRef(prefix: string) {
  const d = new Date();
  const ymd = `${String(d.getUTCFullYear()).slice(2)}${String(d.getUTCMonth() + 1).padStart(2, "0")}${String(d.getUTCDate()).padStart(2, "0")}`;
  const rand = crypto.getRandomValues(new Uint32Array(1))[0].toString(36).toUpperCase().slice(0, 4).padStart(4, "0");
  return `${prefix}-${ymd}-${rand}`;
}

/** Sends a notification email through Resend if RESEND_API_KEY is set. Never throws. */
export async function notifyAdmin(subject: string, lines: [string, string][], replyTo?: string) {
  try {
    if (!env.RESEND_API_KEY) return;
    const settings = await loadSettings();
    const to = env.ADMIN_NOTIFY_EMAIL || settings.contact.email;
    if (!to) return;
    const from = env.RESEND_FROM || `${settings.brand.name} <onboarding@resend.dev>`;
    const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);
    const rows = lines
      .filter(([, v]) => v)
      .map(
        ([k, v]) =>
          `<tr><td style="padding:6px 12px 6px 0;color:#6b645c;vertical-align:top;white-space:nowrap">${esc(k)}</td><td style="padding:6px 0;white-space:pre-wrap">${esc(v)}</td></tr>`,
      )
      .join("");
    const html = `<div style="font-family:Arial,sans-serif;font-size:14px;color:#1f1b18"><h2 style="font-weight:600">${esc(subject)}</h2><table>${rows}</table></div>`;
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to: [to], subject, html, ...(replyTo ? { reply_to: replyTo } : {}) }),
    });
  } catch (err) {
    console.error("notifyAdmin failed", err);
  }
}
