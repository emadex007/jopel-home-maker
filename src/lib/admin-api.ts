// Admin server functions. Every function checks the session cookie first.
import { createServerFn } from "@tanstack/react-start";
import { deleteCookie, getCookie, setCookie } from "@tanstack/react-start/server";
import { env } from "~/lib/env";
import { SETTINGS_KEYS, SITE_DEFAULTS, type SettingsKey } from "~/lib/site-defaults";
import { loadSettings } from "~/server/db";
import {
  SESSION_COOKIE,
  SESSION_DAYS,
  createSession,
  deleteSession,
  getStaffByToken,
  hashPassword,
  staffCount,
  verifyPassword,
  type StaffUser,
} from "~/server/auth";

// ---------- helpers ----------

class AuthError extends Error {}

async function requireStaff(role?: "owner"): Promise<StaffUser> {
  const user = await getStaffByToken(getCookie(SESSION_COOKIE));
  if (!user) throw new AuthError("Your session has expired. Please log in again.");
  if (role === "owner" && user.role !== "owner") throw new AuthError("Only the owner account can do this.");
  return user;
}

const str = (v: unknown, max = 500) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const int = (v: unknown, fallback = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? Math.trunc(n) : fallback;
};
const bool = (v: unknown) => (v ? 1 : 0);
const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

export function slugify(s: string) {
  return (
    s
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/&/g, " and ")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80) || "item"
  );
}

async function uniqueSlug(table: "projects" | "services", base: string, exceptId?: number) {
  let slug = slugify(base);
  for (let i = 2; i < 200; i++) {
    const hit = await env.DB.prepare(`SELECT id FROM ${table} WHERE slug = ? AND id != ?`)
      .bind(slug, exceptId ?? -1)
      .first();
    if (!hit) return slug;
    slug = `${slugify(base)}-${i}`;
  }
  return `${slugify(base)}-${Date.now()}`;
}

/** Moves a row up or down by rewriting sort_order for the whole table. */
async function moveRow(table: "projects" | "services" | "testimonials" | "project_photos" | "clients", id: number, dir: -1 | 1, where = "1=1", binds: unknown[] = []) {
  const { results } = await env.DB.prepare(`SELECT id FROM ${table} WHERE ${where} ORDER BY sort_order, id`)
    .bind(...binds)
    .all<{ id: number }>();
  const ids = (results ?? []).map((r) => r.id);
  const i = ids.indexOf(id);
  const j = i + dir;
  if (i < 0 || j < 0 || j >= ids.length) return;
  [ids[i], ids[j]] = [ids[j], ids[i]];
  await env.DB.batch(ids.map((rid, idx) => env.DB.prepare(`UPDATE ${table} SET sort_order = ? WHERE id = ?`).bind(idx, rid)));
}

/** Removes an R2 file if it was uploaded through the dashboard. */
async function deleteMediaFile(url: string) {
  if (!url.startsWith("/media/")) return;
  const key = decodeURIComponent(url.slice("/media/".length));
  if (key.includes("..")) return;
  try {
    await env.MEDIA.delete(key);
  } catch (err) {
    console.error("R2 delete failed", err);
  }
}

async function mediaStillUsed(url: string) {
  const r = await env.DB.prepare(
    `SELECT (SELECT COUNT(*) FROM project_photos WHERE url = ?1) + (SELECT COUNT(*) FROM projects WHERE cover_image = ?1)
          + (SELECT COUNT(*) FROM services WHERE image = ?1) + (SELECT COUNT(*) FROM clients WHERE logo = ?1) + (SELECT COUNT(*) FROM settings WHERE value LIKE '%' || ?1 || '%') AS n`,
  )
    .bind(url)
    .first<{ n: number }>();
  return (r?.n ?? 0) > 0;
}

function setSessionCookie(token: string) {
  setCookie(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: env.SITE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DAYS * 86400,
  });
}

// ---------- auth ----------

export const getMe = createServerFn({ method: "GET" }).handler(async () => {
  return getStaffByToken(getCookie(SESSION_COOKIE));
});

export const getAuthState = createServerFn({ method: "GET" }).handler(async () => {
  const [me, count] = await Promise.all([getStaffByToken(getCookie(SESSION_COOKIE)), staffCount()]);
  return { me, needsSetup: count === 0, setupCodeConfigured: !!env.ADMIN_SETUP_CODE };
});

export const login = createServerFn({ method: "POST" })
  .inputValidator((d: { email: string; password: string }) => d)
  .handler(async ({ data }) => {
    const email = str(data.email, 160).toLowerCase();
    const password = typeof data.password === "string" ? data.password : "";
    const row = await env.DB.prepare("SELECT id, password_hash, active FROM staff WHERE email = ?")
      .bind(email)
      .first<{ id: number; password_hash: string; active: number }>();
    const ok = row && row.active === 1 && (await verifyPassword(password, row.password_hash));
    if (!ok) {
      await new Promise((r) => setTimeout(r, 400)); // slow down guessing
      return { ok: false as const, error: "Wrong email or password." };
    }
    setSessionCookie(await createSession(row.id));
    return { ok: true as const };
  });

export const setupOwner = createServerFn({ method: "POST" })
  .inputValidator((d: { name: string; email: string; password: string; code: string }) => d)
  .handler(async ({ data }) => {
    if ((await staffCount()) > 0) return { ok: false as const, error: "An owner account already exists. Please log in." };
    if (!env.ADMIN_SETUP_CODE) return { ok: false as const, error: "ADMIN_SETUP_CODE is not set on the server yet. See the README." };
    if (str(data.code, 200) !== env.ADMIN_SETUP_CODE) return { ok: false as const, error: "The setup code is not correct." };
    const name = str(data.name, 120);
    const email = str(data.email, 160).toLowerCase();
    const password = typeof data.password === "string" ? data.password : "";
    if (name.length < 2) return { ok: false as const, error: "Please enter your name." };
    if (!isEmail(email)) return { ok: false as const, error: "Please enter a valid email." };
    if (password.length < 8) return { ok: false as const, error: "Password must be at least 8 characters." };
    const res = await env.DB.prepare("INSERT INTO staff (name, email, password_hash, role) VALUES (?, ?, ?, 'owner')")
      .bind(name, email, await hashPassword(password))
      .run();
    setSessionCookie(await createSession(Number(res.meta.last_row_id)));
    return { ok: true as const };
  });

export const logout = createServerFn({ method: "POST" }).handler(async () => {
  await deleteSession(getCookie(SESSION_COOKIE));
  deleteCookie(SESSION_COOKIE, { path: "/" });
  return { ok: true };
});

export const changeMyPassword = createServerFn({ method: "POST" })
  .inputValidator((d: { current: string; next: string }) => d)
  .handler(async ({ data }) => {
    const me = await requireStaff();
    const row = await env.DB.prepare("SELECT password_hash FROM staff WHERE id = ?").bind(me.id).first<{ password_hash: string }>();
    if (!row || !(await verifyPassword(String(data.current ?? ""), row.password_hash))) return { ok: false as const, error: "Current password is wrong." };
    if (String(data.next ?? "").length < 8) return { ok: false as const, error: "New password must be at least 8 characters." };
    await env.DB.prepare("UPDATE staff SET password_hash = ? WHERE id = ?").bind(await hashPassword(String(data.next)), me.id).run();
    return { ok: true as const };
  });

// ---------- dashboard ----------

export const getDashboard = createServerFn({ method: "GET" }).handler(async () => {
  await requireStaff();
  const q = (sql: string) => env.DB.prepare(sql);
  const [counts, bookings, quotes, messages] = await env.DB.batch([
    q(`SELECT
        (SELECT COUNT(*) FROM bookings WHERE status = 'new') AS newBookings,
        (SELECT COUNT(*) FROM quote_requests WHERE status = 'new') AS newQuotes,
        (SELECT COUNT(*) FROM messages WHERE is_read = 0) AS unreadMessages,
        (SELECT COUNT(*) FROM projects) AS projects,
        (SELECT COUNT(*) FROM projects WHERE published = 1) AS publishedProjects,
        (SELECT COUNT(*) FROM project_photos) AS photos,
        (SELECT COUNT(*) FROM services WHERE active = 1) AS services`),
    q("SELECT id, ref, name, phone, service, preferred_date, status, created_at FROM bookings ORDER BY id DESC LIMIT 5"),
    q("SELECT id, ref, name, phone, project_type, budget, status, created_at FROM quote_requests ORDER BY id DESC LIMIT 5"),
    q("SELECT id, source, name, email, subject, is_read, created_at FROM messages ORDER BY id DESC LIMIT 5"),
  ]);
  return {
    counts: (counts.results?.[0] ?? {}) as Record<string, number>,
    bookings: (bookings.results ?? []) as Record<string, string | number>[],
    quotes: (quotes.results ?? []) as Record<string, string | number>[],
    messages: (messages.results ?? []) as Record<string, string | number>[],
  };
});

// ---------- projects ----------

export type AdminProjectRow = {
  id: number;
  slug: string;
  title: string;
  category: string;
  location: string;
  year: string;
  cover_image: string;
  featured: number;
  published: number;
  photo_count: number;
};

export type AdminProject = {
  id: number;
  slug: string;
  title: string;
  category: string;
  location: string;
  year: string;
  duration: string;
  scope: string;
  summary: string;
  description: string;
  cover_image: string;
  featured: number;
  published: number;
  photos: { id: number; url: string; caption: string }[];
};

export const adminListProjects = createServerFn({ method: "GET" }).handler(async () => {
  await requireStaff();
  const { results } = await env.DB.prepare(
    `SELECT p.id, p.slug, p.title, p.category, p.location, p.year, p.cover_image, p.featured, p.published,
       (SELECT COUNT(*) FROM project_photos ph WHERE ph.project_id = p.id) AS photo_count
     FROM projects p ORDER BY p.sort_order, p.id DESC`,
  ).all<AdminProjectRow>();
  const { results: cats } = await env.DB.prepare("SELECT DISTINCT category FROM projects WHERE category != '' ORDER BY category").all<{ category: string }>();
  return { projects: results ?? [], categories: (cats ?? []).map((c) => c.category) };
});

export const adminGetProject = createServerFn({ method: "GET" })
  .inputValidator((id: number) => int(id))
  .handler(async ({ data: id }): Promise<AdminProject | null> => {
    await requireStaff();
    const p = await env.DB.prepare(
      "SELECT id, slug, title, category, location, year, duration, scope, summary, description, cover_image, featured, published FROM projects WHERE id = ?",
    )
      .bind(id)
      .first<Omit<AdminProject, "photos">>();
    if (!p) return null;
    const { results } = await env.DB.prepare("SELECT id, url, caption FROM project_photos WHERE project_id = ? ORDER BY sort_order, id")
      .bind(id)
      .all<{ id: number; url: string; caption: string }>();
    return { ...p, photos: results ?? [] };
  });

export type ProjectInput = Omit<AdminProject, "id" | "photos" | "slug"> & { id?: number; slug?: string };

export const saveProject = createServerFn({ method: "POST" })
  .inputValidator((d: ProjectInput) => d)
  .handler(async ({ data }) => {
    await requireStaff();
    const title = str(data.title, 160);
    if (title.length < 2) return { ok: false as const, error: "Please enter a project title." };
    const id = data.id ? int(data.id) : undefined;
    const slug = await uniqueSlug("projects", str(data.slug, 100) || title, id);
    const f = [
      slug,
      title,
      str(data.category, 60) || "Residential",
      str(data.location, 120),
      str(data.year, 20),
      str(data.duration, 60),
      str(data.scope, 500),
      str(data.summary, 400),
      str(data.description, 10000),
      str(data.cover_image, 500),
      bool(data.featured),
      bool(data.published),
    ];
    if (id) {
      await env.DB.prepare(
        `UPDATE projects SET slug=?, title=?, category=?, location=?, year=?, duration=?, scope=?, summary=?, description=?,
           cover_image=?, featured=?, published=?, updated_at=datetime('now') WHERE id=?`,
      )
        .bind(...f, id)
        .run();
      return { ok: true as const, id, slug };
    }
    const res = await env.DB.prepare(
      `INSERT INTO projects (slug, title, category, location, year, duration, scope, summary, description, cover_image, featured, published, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, (SELECT COALESCE(MIN(sort_order), 0) - 1 FROM projects))`,
    )
      .bind(...f)
      .run();
    return { ok: true as const, id: Number(res.meta.last_row_id), slug };
  });

export const deleteProject = createServerFn({ method: "POST" })
  .inputValidator((id: number) => int(id))
  .handler(async ({ data: id }) => {
    await requireStaff();
    const { results } = await env.DB.prepare("SELECT url FROM project_photos WHERE project_id = ?").bind(id).all<{ url: string }>();
    const cover = await env.DB.prepare("SELECT cover_image FROM projects WHERE id = ?").bind(id).first<{ cover_image: string }>();
    await env.DB.batch([
      env.DB.prepare("DELETE FROM project_photos WHERE project_id = ?").bind(id),
      env.DB.prepare("DELETE FROM projects WHERE id = ?").bind(id),
    ]);
    const urls = new Set([...(results ?? []).map((r) => r.url), cover?.cover_image ?? ""]);
    for (const u of urls) if (u && !(await mediaStillUsed(u))) await deleteMediaFile(u);
    return { ok: true };
  });

export const moveProject = createServerFn({ method: "POST" })
  .inputValidator((d: { id: number; dir: -1 | 1 }) => d)
  .handler(async ({ data }) => {
    await requireStaff();
    await moveRow("projects", int(data.id), data.dir === -1 ? -1 : 1);
    return { ok: true };
  });

export const toggleProject = createServerFn({ method: "POST" })
  .inputValidator((d: { id: number; field: "featured" | "published"; value: boolean }) => d)
  .handler(async ({ data }) => {
    await requireStaff();
    const field = data.field === "featured" ? "featured" : "published";
    await env.DB.prepare(`UPDATE projects SET ${field} = ?, updated_at = datetime('now') WHERE id = ?`).bind(bool(data.value), int(data.id)).run();
    return { ok: true };
  });

export const addProjectPhotos = createServerFn({ method: "POST" })
  .inputValidator((d: { projectId: number; urls: string[] }) => d)
  .handler(async ({ data }) => {
    await requireStaff();
    const pid = int(data.projectId);
    const urls = (Array.isArray(data.urls) ? data.urls : []).map((u) => str(u, 500)).filter(Boolean).slice(0, 60);
    if (!urls.length) return { ok: true };
    const max = await env.DB.prepare("SELECT COALESCE(MAX(sort_order), -1) AS m FROM project_photos WHERE project_id = ?").bind(pid).first<{ m: number }>();
    let order = (max?.m ?? -1) + 1;
    await env.DB.batch(urls.map((u) => env.DB.prepare("INSERT INTO project_photos (project_id, url, sort_order) VALUES (?, ?, ?)").bind(pid, u, order++)));
    // First photo becomes the cover if the project has none.
    await env.DB.prepare("UPDATE projects SET cover_image = ? WHERE id = ? AND cover_image = ''").bind(urls[0], pid).run();
    return { ok: true };
  });

export const updatePhoto = createServerFn({ method: "POST" })
  .inputValidator((d: { id: number; caption: string }) => d)
  .handler(async ({ data }) => {
    await requireStaff();
    await env.DB.prepare("UPDATE project_photos SET caption = ? WHERE id = ?").bind(str(data.caption, 300), int(data.id)).run();
    return { ok: true };
  });

export const deletePhoto = createServerFn({ method: "POST" })
  .inputValidator((id: number) => int(id))
  .handler(async ({ data: id }) => {
    await requireStaff();
    const row = await env.DB.prepare("SELECT url FROM project_photos WHERE id = ?").bind(id).first<{ url: string }>();
    await env.DB.prepare("DELETE FROM project_photos WHERE id = ?").bind(id).run();
    if (row && !(await mediaStillUsed(row.url))) await deleteMediaFile(row.url);
    return { ok: true };
  });

export const reorderPhotos = createServerFn({ method: "POST" })
  .inputValidator((d: { projectId: number; ids: number[] }) => d)
  .handler(async ({ data }) => {
    await requireStaff();
    const pid = int(data.projectId);
    const ids = (Array.isArray(data.ids) ? data.ids : []).map((i) => int(i)).slice(0, 500);
    if (ids.length) {
      await env.DB.batch(ids.map((id, idx) => env.DB.prepare("UPDATE project_photos SET sort_order = ? WHERE id = ? AND project_id = ?").bind(idx, id, pid)));
    }
    return { ok: true };
  });

// ---------- services ----------

export type AdminService = { id?: number; slug?: string; title: string; summary: string; description: string; image: string; active: number };

export const adminListServices = createServerFn({ method: "GET" }).handler(async () => {
  await requireStaff();
  const { results } = await env.DB.prepare("SELECT id, slug, title, summary, description, image, active FROM services ORDER BY sort_order, id").all<Required<AdminService>>();
  return results ?? [];
});

export const saveService = createServerFn({ method: "POST" })
  .inputValidator((d: AdminService) => d)
  .handler(async ({ data }) => {
    await requireStaff();
    const title = str(data.title, 120);
    if (title.length < 2) return { ok: false as const, error: "Please enter a service name." };
    const id = data.id ? int(data.id) : undefined;
    const slug = await uniqueSlug("services", str(data.slug, 100) || title, id);
    const f = [slug, title, str(data.summary, 300), str(data.description, 4000), str(data.image, 500), bool(data.active)];
    if (id) {
      await env.DB.prepare("UPDATE services SET slug=?, title=?, summary=?, description=?, image=?, active=? WHERE id=?").bind(...f, id).run();
    } else {
      await env.DB.prepare(
        "INSERT INTO services (slug, title, summary, description, image, active, sort_order) VALUES (?, ?, ?, ?, ?, ?, (SELECT COALESCE(MAX(sort_order), -1) + 1 FROM services))",
      )
        .bind(...f)
        .run();
    }
    return { ok: true as const };
  });

export const deleteService = createServerFn({ method: "POST" })
  .inputValidator((id: number) => int(id))
  .handler(async ({ data: id }) => {
    await requireStaff();
    const row = await env.DB.prepare("SELECT image FROM services WHERE id = ?").bind(id).first<{ image: string }>();
    await env.DB.prepare("DELETE FROM services WHERE id = ?").bind(id).run();
    if (row?.image && !(await mediaStillUsed(row.image))) await deleteMediaFile(row.image);
    return { ok: true };
  });

export const moveService = createServerFn({ method: "POST" })
  .inputValidator((d: { id: number; dir: -1 | 1 }) => d)
  .handler(async ({ data }) => {
    await requireStaff();
    await moveRow("services", int(data.id), data.dir === -1 ? -1 : 1);
    return { ok: true };
  });

// ---------- testimonials ----------

export type AdminTestimonial = { id?: number; name: string; role: string; quote: string; active: number };

export const adminListTestimonials = createServerFn({ method: "GET" }).handler(async () => {
  await requireStaff();
  const { results } = await env.DB.prepare("SELECT id, name, role, quote, active FROM testimonials ORDER BY sort_order, id").all<Required<AdminTestimonial>>();
  return results ?? [];
});

export const saveTestimonial = createServerFn({ method: "POST" })
  .inputValidator((d: AdminTestimonial) => d)
  .handler(async ({ data }) => {
    await requireStaff();
    const name = str(data.name, 120);
    const quote = str(data.quote, 1500);
    if (!name || quote.length < 5) return { ok: false as const, error: "Please enter the client's name and their words." };
    const f = [name, str(data.role, 120), quote, bool(data.active)];
    if (data.id) {
      await env.DB.prepare("UPDATE testimonials SET name=?, role=?, quote=?, active=? WHERE id=?").bind(...f, int(data.id)).run();
    } else {
      await env.DB.prepare("INSERT INTO testimonials (name, role, quote, active, sort_order) VALUES (?, ?, ?, ?, (SELECT COALESCE(MAX(sort_order), -1) + 1 FROM testimonials))")
        .bind(...f)
        .run();
    }
    return { ok: true as const };
  });

export const deleteTestimonial = createServerFn({ method: "POST" })
  .inputValidator((id: number) => int(id))
  .handler(async ({ data: id }) => {
    await requireStaff();
    await env.DB.prepare("DELETE FROM testimonials WHERE id = ?").bind(id).run();
    return { ok: true };
  });

export const moveTestimonial = createServerFn({ method: "POST" })
  .inputValidator((d: { id: number; dir: -1 | 1 }) => d)
  .handler(async ({ data }) => {
    await requireStaff();
    await moveRow("testimonials", int(data.id), data.dir === -1 ? -1 : 1);
    return { ok: true };
  });

// ---------- clients & partners ----------

export type AdminClient = { id?: number; name: string; logo: string; url: string; active: number };

export const adminListClients = createServerFn({ method: "GET" }).handler(async () => {
  await requireStaff();
  const { results } = await env.DB.prepare("SELECT id, name, logo, url, active FROM clients ORDER BY sort_order, id").all<Required<AdminClient>>();
  return results ?? [];
});

export const saveClient = createServerFn({ method: "POST" })
  .inputValidator((d: AdminClient) => d)
  .handler(async ({ data }) => {
    await requireStaff();
    const name = str(data.name, 120);
    const logo = str(data.logo, 500);
    let url = str(data.url, 300);
    if (url && !/^https?:\/\//i.test(url)) url = `https://${url}`;
    if (name.length < 2) return { ok: false as const, error: "Please enter the company name." };
    if (!logo) return { ok: false as const, error: "Please upload the company's logo." };
    const f = [name, logo, url, bool(data.active)];
    if (data.id) {
      await env.DB.prepare("UPDATE clients SET name=?, logo=?, url=?, active=? WHERE id=?").bind(...f, int(data.id)).run();
    } else {
      await env.DB.prepare("INSERT INTO clients (name, logo, url, active, sort_order) VALUES (?, ?, ?, ?, (SELECT COALESCE(MAX(sort_order), -1) + 1 FROM clients))")
        .bind(...f)
        .run();
    }
    return { ok: true as const };
  });

export const deleteClient = createServerFn({ method: "POST" })
  .inputValidator((id: number) => int(id))
  .handler(async ({ data: id }) => {
    await requireStaff();
    const row = await env.DB.prepare("SELECT logo FROM clients WHERE id = ?").bind(id).first<{ logo: string }>();
    await env.DB.prepare("DELETE FROM clients WHERE id = ?").bind(id).run();
    if (row?.logo && !(await mediaStillUsed(row.logo))) await deleteMediaFile(row.logo);
    return { ok: true };
  });

export const moveClient = createServerFn({ method: "POST" })
  .inputValidator((d: { id: number; dir: -1 | 1 }) => d)
  .handler(async ({ data }) => {
    await requireStaff();
    await moveRow("clients", int(data.id), data.dir === -1 ? -1 : 1);
    return { ok: true };
  });

// ---------- settings ----------

export const adminGetSettings = createServerFn({ method: "GET" }).handler(async () => {
  await requireStaff();
  return loadSettings();
});

export const saveSettingsSection = createServerFn({ method: "POST" })
  .inputValidator((d: { key: SettingsKey; value: Record<string, unknown> }) => d)
  .handler(async ({ data }) => {
    await requireStaff();
    if (!(SETTINGS_KEYS as string[]).includes(data.key)) return { ok: false as const, error: "Unknown settings section." };
    // Keep only fields that exist in the defaults, with the same basic type.
    const defaults = SITE_DEFAULTS[data.key] as Record<string, unknown>;
    const clean: Record<string, unknown> = {};
    for (const [k, def] of Object.entries(defaults)) {
      const v = data.value?.[k];
      if (v === undefined) continue;
      if (typeof def === "number") clean[k] = Number.isFinite(Number(v)) ? Number(v) : def;
      else if (typeof def === "boolean") clean[k] = !!v;
      else if (typeof def === "string") clean[k] = typeof v === "string" ? v.slice(0, 5000) : def;
      else if (Array.isArray(def)) clean[k] = Array.isArray(v) ? v.slice(0, 30) : def;
      else if (def && typeof def === "object") clean[k] = v && typeof v === "object" && !Array.isArray(v) ? v : def;
    }
    const json = JSON.stringify(clean);
    if (json.length > 60_000) return { ok: false as const, error: "That section is too large to save." };
    await env.DB.prepare(
      "INSERT INTO settings (key, value, updated_at) VALUES (?, ?, datetime('now')) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at",
    )
      .bind(data.key, json)
      .run();
    return { ok: true as const };
  });

export const resetSettingsSection = createServerFn({ method: "POST" })
  .inputValidator((key: SettingsKey) => key)
  .handler(async ({ data: key }) => {
    await requireStaff();
    await env.DB.prepare("DELETE FROM settings WHERE key = ?").bind(String(key)).run();
    return { ok: true };
  });

// ---------- inbox ----------

export type InboxTab = "bookings" | "quotes" | "messages";

export const getInbox = createServerFn({ method: "GET" })
  .inputValidator((d: { tab: InboxTab; status?: string }) => d)
  .handler(async ({ data }) => {
    await requireStaff();
    const status = str(data.status, 20);
    if (data.tab === "bookings") {
      const sql = `SELECT * FROM bookings ${status ? "WHERE status = ?" : ""} ORDER BY id DESC LIMIT 200`;
      const { results } = await (status ? env.DB.prepare(sql).bind(status) : env.DB.prepare(sql)).all();
      return { tab: data.tab, items: (results ?? []) as Record<string, string | number>[] };
    }
    if (data.tab === "quotes") {
      const sql = `SELECT * FROM quote_requests ${status ? "WHERE status = ?" : ""} ORDER BY id DESC LIMIT 200`;
      const { results } = await (status ? env.DB.prepare(sql).bind(status) : env.DB.prepare(sql)).all();
      return { tab: data.tab, items: (results ?? []) as Record<string, string | number>[] };
    }
    const where = status === "unread" ? "WHERE is_read = 0" : status === "read" ? "WHERE is_read = 1" : "";
    const { results } = await env.DB.prepare(`SELECT * FROM messages ${where} ORDER BY id DESC LIMIT 200`).all();
    return { tab: "messages" as InboxTab, items: (results ?? []) as Record<string, string | number>[] };
  });

export const setInboxStatus = createServerFn({ method: "POST" })
  .inputValidator((d: { tab: InboxTab; id: number; status: string }) => d)
  .handler(async ({ data }) => {
    await requireStaff();
    const id = int(data.id);
    if (data.tab === "bookings") {
      const s = ["new", "confirmed", "done", "cancelled"].includes(data.status) ? data.status : "new";
      await env.DB.prepare("UPDATE bookings SET status = ? WHERE id = ?").bind(s, id).run();
    } else if (data.tab === "quotes") {
      const s = ["new", "quoted", "won", "lost"].includes(data.status) ? data.status : "new";
      await env.DB.prepare("UPDATE quote_requests SET status = ? WHERE id = ?").bind(s, id).run();
    } else {
      await env.DB.prepare("UPDATE messages SET is_read = ? WHERE id = ?").bind(data.status === "read" ? 1 : 0, id).run();
    }
    return { ok: true };
  });

export const deleteInboxItem = createServerFn({ method: "POST" })
  .inputValidator((d: { tab: InboxTab; id: number }) => d)
  .handler(async ({ data }) => {
    await requireStaff();
    const id = int(data.id);
    if (data.tab === "quotes") {
      const row = await env.DB.prepare("SELECT attachments FROM quote_requests WHERE id = ?").bind(id).first<{ attachments: string }>();
      await env.DB.prepare("DELETE FROM quote_requests WHERE id = ?").bind(id).run();
      try {
        for (const u of JSON.parse(row?.attachments || "[]") as string[]) await deleteMediaFile(u);
      } catch {
        /* ignore */
      }
    } else {
      const table = data.tab === "bookings" ? "bookings" : "messages";
      await env.DB.prepare(`DELETE FROM ${table} WHERE id = ?`).bind(id).run();
    }
    return { ok: true };
  });

// ---------- staff ----------

export const listStaff = createServerFn({ method: "GET" }).handler(async () => {
  const me = await requireStaff();
  const { results } = await env.DB.prepare("SELECT id, name, email, role, active, created_at FROM staff ORDER BY role = 'owner' DESC, name").all<{
    id: number;
    name: string;
    email: string;
    role: string;
    active: number;
    created_at: string;
  }>();
  return { me, staff: results ?? [] };
});

export const saveStaff = createServerFn({ method: "POST" })
  .inputValidator((d: { id?: number; name: string; email: string; role: string; password?: string; active: boolean }) => d)
  .handler(async ({ data }) => {
    const me = await requireStaff("owner");
    const name = str(data.name, 120);
    const email = str(data.email, 160).toLowerCase();
    const role = data.role === "owner" ? "owner" : "staff";
    const password = typeof data.password === "string" ? data.password : "";
    if (name.length < 2) return { ok: false as const, error: "Please enter a name." };
    if (!isEmail(email)) return { ok: false as const, error: "Please enter a valid email." };
    const clash = await env.DB.prepare("SELECT id FROM staff WHERE email = ? AND id != ?").bind(email, int(data.id ?? -1)).first();
    if (clash) return { ok: false as const, error: "Another account already uses that email." };

    if (data.id) {
      const id = int(data.id);
      if (id === me.id && (role !== "owner" || !data.active)) return { ok: false as const, error: "You can't remove your own owner access." };
      await env.DB.prepare("UPDATE staff SET name=?, email=?, role=?, active=? WHERE id=?").bind(name, email, role, bool(data.active), id).run();
      if (password) {
        if (password.length < 8) return { ok: false as const, error: "Password must be at least 8 characters." };
        await env.DB.prepare("UPDATE staff SET password_hash = ? WHERE id = ?").bind(await hashPassword(password), id).run();
        await env.DB.prepare("DELETE FROM sessions WHERE staff_id = ?").bind(id).run();
      }
      if (!data.active) await env.DB.prepare("DELETE FROM sessions WHERE staff_id = ?").bind(id).run();
      return { ok: true as const };
    }
    if (password.length < 8) return { ok: false as const, error: "Password must be at least 8 characters." };
    await env.DB.prepare("INSERT INTO staff (name, email, password_hash, role, active) VALUES (?, ?, ?, ?, ?)")
      .bind(name, email, await hashPassword(password), role, bool(data.active))
      .run();
    return { ok: true as const };
  });

export const deleteStaff = createServerFn({ method: "POST" })
  .inputValidator((id: number) => int(id))
  .handler(async ({ data: id }) => {
    const me = await requireStaff("owner");
    if (id === me.id) return { ok: false as const, error: "You can't delete your own account." };
    await env.DB.prepare("DELETE FROM staff WHERE id = ?").bind(id).run();
    return { ok: true as const };
  });

export { AuthError };
