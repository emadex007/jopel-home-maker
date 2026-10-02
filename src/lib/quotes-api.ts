// Quotation server functions: dashboard (login required) + the client's public quote page.
import { createServerFn } from "@tanstack/react-start";
import { env } from "~/lib/env";
import { emailLayout, loadSettings, notifyAdmin, sendEmail, escapeHtml } from "~/server/db";
import { requireStaff } from "~/server/guard";
import { naira, parseItems, quoteTotals, type QuoteItem } from "~/lib/quote-calc";

const str = (v: unknown, max = 500) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const num = (v: unknown) => (Number.isFinite(Number(v)) ? Number(v) : 0);
const int = (v: unknown) => Math.trunc(num(v));

export type QuoteStatus = "draft" | "sent" | "accepted" | "declined";

export type Quote = {
  id: number;
  number: string;
  quote_request_id: number | null;
  client_name: string;
  client_email: string;
  client_phone: string;
  client_address: string;
  title: string;
  items: QuoteItem[];
  discount: number;
  tax_rate: number;
  notes: string;
  valid_until: string;
  status: QuoteStatus;
  public_token: string;
  created_at: string;
  updated_at: string;
};

type QuoteRow = Omit<Quote, "items" | "title"> & { items: string; title?: string };

function fromRow(r: QuoteRow): Quote {
  return { ...r, title: r.title ?? "", items: parseItems(r.items) };
}

const addDays = (days: number) => {
  const d = new Date(Date.now() + Math.max(0, days) * 86400_000);
  return d.toISOString().slice(0, 10);
};

function newToken() {
  return [...crypto.getRandomValues(new Uint8Array(18))].map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function nextNumber(prefix: string) {
  const r = await env.DB.prepare("SELECT COALESCE(MAX(id), 0) + 1 AS n FROM quotes").first<{ n: number }>();
  let n = r?.n ?? 1;
  for (;;) {
    const num = `${prefix || "Q"}-${String(n).padStart(4, "0")}`;
    const hit = await env.DB.prepare("SELECT id FROM quotes WHERE number = ?").bind(num).first();
    if (!hit) return num;
    n++;
  }
}

// ---------- dashboard ----------

export const listQuotes = createServerFn({ method: "GET" })
  .inputValidator((d: { status?: string }) => d)
  .handler(async ({ data }) => {
    await requireStaff();
    const status = str(data.status, 20);
    const sql = `SELECT * FROM quotes ${status ? "WHERE status = ?" : ""} ORDER BY id DESC LIMIT 300`;
    const { results } = await (status ? env.DB.prepare(sql).bind(status) : env.DB.prepare(sql)).all<QuoteRow>();
    return (results ?? []).map((r) => {
      const q = fromRow(r);
      return { ...q, total: quoteTotals(q.items, q.discount, q.tax_rate).total };
    });
  });

/** A blank draft (not saved yet), optionally pre-filled from a quote request. */
export const newQuoteDraft = createServerFn({ method: "GET" })
  .inputValidator((d: { fromRequestId?: number }) => d)
  .handler(async ({ data }) => {
    await requireStaff();
    const s = await loadSettings();
    const draft = {
      quote_request_id: null as number | null,
      client_name: "",
      client_email: "",
      client_phone: "",
      client_address: "",
      title: "",
      items: [{ description: "", qty: 1, unit: "item", rate: 0 }] as QuoteItem[],
      discount: 0,
      tax_rate: 0,
      notes: s.quotes.notes,
      valid_until: addDays(Number(s.quotes.validDays) || 14),
      request: null as Record<string, string | number> | null,
    };
    if (data.fromRequestId) {
      const r = await env.DB.prepare("SELECT * FROM quote_requests WHERE id = ?").bind(int(data.fromRequestId)).first<Record<string, string | number>>();
      if (r) {
        draft.quote_request_id = Number(r.id);
        draft.client_name = String(r.name ?? "");
        draft.client_email = String(r.email ?? "");
        draft.client_phone = String(r.phone ?? "");
        draft.client_address = String(r.location ?? "");
        draft.title = [r.project_type, r.spaces].filter(Boolean).join(": ");
        const spaces = String(r.spaces ?? "")
          .split(",")
          .map((x) => x.trim())
          .filter(Boolean);
        if (spaces.length) draft.items = spaces.map((sp) => ({ description: `${sp}: design & decoration`, qty: 1, unit: "room", rate: 0 }));
        draft.request = r;
      }
    }
    return draft;
  });

export const getQuote = createServerFn({ method: "GET" })
  .inputValidator((id: number) => int(id))
  .handler(async ({ data: id }) => {
    await requireStaff();
    const r = await env.DB.prepare("SELECT * FROM quotes WHERE id = ?").bind(id).first<QuoteRow>();
    if (!r) return null;
    const q = fromRow(r);
    const request = q.quote_request_id
      ? await env.DB.prepare("SELECT * FROM quote_requests WHERE id = ?").bind(q.quote_request_id).first<Record<string, string | number>>()
      : null;
    return { quote: q, request };
  });

export type QuoteInput = {
  id?: number;
  quote_request_id?: number | null;
  client_name: string;
  client_email: string;
  client_phone: string;
  client_address: string;
  title: string;
  items: QuoteItem[];
  discount: number;
  tax_rate: number;
  notes: string;
  valid_until: string;
};

export const saveQuote = createServerFn({ method: "POST" })
  .inputValidator((d: QuoteInput) => d)
  .handler(async ({ data }) => {
    await requireStaff();
    const name = str(data.client_name, 160);
    if (name.length < 2) return { ok: false as const, error: "Please enter the client's name." };
    const items = (Array.isArray(data.items) ? data.items : [])
      .map((x) => ({ description: str(x.description, 500), qty: num(x.qty), unit: str(x.unit, 20), rate: num(x.rate) }))
      .filter((x) => x.description || x.rate)
      .slice(0, 200);
    if (!items.length) return { ok: false as const, error: "Add at least one item to the quotation." };
    const valid = /^\d{4}-\d{2}-\d{2}$/.test(str(data.valid_until, 10)) ? str(data.valid_until, 10) : "";
    const fields = [
      name,
      str(data.client_email, 160),
      str(data.client_phone, 40),
      str(data.client_address, 300),
      str(data.title, 200),
      JSON.stringify(items),
      Math.max(0, num(data.discount)),
      Math.min(100, Math.max(0, num(data.tax_rate))),
      str(data.notes, 4000),
      valid,
    ];
    if (data.id) {
      await env.DB.prepare(
        `UPDATE quotes SET client_name=?, client_email=?, client_phone=?, client_address=?, title=?, items=?, discount=?, tax_rate=?, notes=?, valid_until=?,
           updated_at=datetime('now') WHERE id=?`,
      )
        .bind(...fields, int(data.id))
        .run();
      return { ok: true as const, id: int(data.id) };
    }
    const s = await loadSettings();
    const number = await nextNumber(s.quotes.numberPrefix);
    const res = await env.DB.prepare(
      `INSERT INTO quotes (client_name, client_email, client_phone, client_address, title, items, discount, tax_rate, notes, valid_until, number, quote_request_id, public_token)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
      .bind(...fields, number, data.quote_request_id ? int(data.quote_request_id) : null, newToken())
      .run();
    return { ok: true as const, id: Number(res.meta.last_row_id) };
  });

export const setQuoteStatus = createServerFn({ method: "POST" })
  .inputValidator((d: { id: number; status: QuoteStatus }) => d)
  .handler(async ({ data }) => {
    await requireStaff();
    const status = ["draft", "sent", "accepted", "declined"].includes(data.status) ? data.status : "draft";
    await env.DB.prepare("UPDATE quotes SET status = ?, updated_at = datetime('now') WHERE id = ?").bind(status, int(data.id)).run();
    await syncRequestStatus(int(data.id), status);
    return { ok: true };
  });

/** Keep the original quote request's status in step with its quotation. */
async function syncRequestStatus(quoteId: number, status: QuoteStatus) {
  const map: Partial<Record<QuoteStatus, string>> = { sent: "quoted", accepted: "won", declined: "lost" };
  const reqStatus = map[status];
  if (!reqStatus) return;
  await env.DB.prepare("UPDATE quote_requests SET status = ? WHERE id = (SELECT quote_request_id FROM quotes WHERE id = ?)").bind(reqStatus, quoteId).run();
}

export const deleteQuote = createServerFn({ method: "POST" })
  .inputValidator((id: number) => int(id))
  .handler(async ({ data: id }) => {
    await requireStaff();
    await env.DB.prepare("DELETE FROM quotes WHERE id = ?").bind(id).run();
    return { ok: true };
  });

/** Emails the quote link to the client and marks it as sent. */
export const emailQuote = createServerFn({ method: "POST" })
  .inputValidator((d: { id: number; origin: string; message?: string }) => d)
  .handler(async ({ data }) => {
    await requireStaff();
    const r = await env.DB.prepare("SELECT * FROM quotes WHERE id = ?").bind(int(data.id)).first<QuoteRow>();
    if (!r) return { ok: false as const, error: "Quotation not found." };
    const q = fromRow(r);
    if (!q.client_email) return { ok: false as const, error: "Add the client's email address first (and save)." };
    if (!env.RESEND_API_KEY) return { ok: false as const, error: "Email isn't set up yet (RESEND_API_KEY). Send the link by WhatsApp instead." };
    const s = await loadSettings();
    const origin = /^https?:\/\/[^/]+$/.test(str(data.origin, 200)) ? str(data.origin, 200) : "";
    const link = `${origin}/q/${q.public_token}`;
    const t = quoteTotals(q.items, q.discount, q.tax_rate);
    const first = q.client_name.split(" ")[0];
    const msg = str(data.message, 2000);
    const inner = `
      <p style="margin:0 0 14px">Hello ${escapeHtml(first)},</p>
      ${msg ? `<p style="white-space:pre-wrap;margin:0 0 14px">${escapeHtml(msg)}</p>` : `<p style="margin:0 0 14px">Please find your quotation <b>${escapeHtml(q.number)}</b>${q.title ? ` for <b>${escapeHtml(q.title)}</b>` : ""}.</p>`}
      <table role="presentation" cellpadding="0" cellspacing="0" style="margin:20px 0;background:#f6f3ee;border-radius:6px;width:100%">
        <tr><td style="padding:16px 20px">
          <div style="font-size:12px;color:#6b645c;text-transform:uppercase;letter-spacing:1px">Total</div>
          <div style="font-family:Georgia,serif;font-size:30px;margin-top:2px">${naira(t.total)}</div>
          ${q.valid_until ? `<div style="font-size:13px;color:#6b645c;margin-top:6px">Valid until ${escapeHtml(q.valid_until)}</div>` : ""}
        </td></tr>
      </table>
      <p style="margin:0;color:#6b645c;font-size:14px">Open the quotation to see the full breakdown. You can print it, save it as a PDF or accept it from the same page. Reply to this email or call ${escapeHtml(s.contact.phone)} with any questions.</p>`;
    const html = emailLayout(s, inner, { preheader: `Quotation ${q.number}: ${naira(t.total)}`, button: { label: "View your quotation", href: link } });
    const ok = await sendEmail({ to: q.client_email, subject: `Your quotation ${q.number} from ${s.brand.name}`, html, replyTo: s.contact.email || undefined });
    if (!ok) return { ok: false as const, error: "The email could not be sent. Check the Resend setup, or send the link by WhatsApp." };
    if (q.status === "draft") {
      await env.DB.prepare("UPDATE quotes SET status = 'sent', updated_at = datetime('now') WHERE id = ?").bind(q.id).run();
      await syncRequestStatus(q.id, "sent");
    }
    return { ok: true as const };
  });

// ---------- public (client) ----------

export const getPublicQuote = createServerFn({ method: "GET" })
  .inputValidator((token: string) => str(token, 80))
  .handler(async ({ data: token }) => {
    if (!/^[0-9a-f]{20,80}$/.test(token)) return null;
    const r = await env.DB.prepare("SELECT * FROM quotes WHERE public_token = ?").bind(token).first<QuoteRow>();
    if (!r) return null;
    const q = fromRow(r);
    // Only show what the client needs; never internal ids.
    return {
      number: q.number,
      title: q.title,
      client_name: q.client_name,
      client_email: q.client_email,
      client_phone: q.client_phone,
      client_address: q.client_address,
      items: q.items,
      discount: q.discount,
      tax_rate: q.tax_rate,
      notes: q.notes,
      valid_until: q.valid_until,
      status: q.status,
      created_at: q.created_at,
      token,
    };
  });

export const acceptPublicQuote = createServerFn({ method: "POST" })
  .inputValidator((token: string) => str(token, 80))
  .handler(async ({ data: token }) => {
    if (!/^[0-9a-f]{20,80}$/.test(token)) return { ok: false as const, error: "Quotation not found." };
    const r = await env.DB.prepare("SELECT id, number, client_name, status, valid_until FROM quotes WHERE public_token = ?")
      .bind(token)
      .first<{ id: number; number: string; client_name: string; status: string; valid_until: string }>();
    if (!r) return { ok: false as const, error: "Quotation not found." };
    if (r.status === "accepted") return { ok: true as const };
    if (r.status === "declined") return { ok: false as const, error: "This quotation is no longer active. Please contact us." };
    if (r.valid_until && r.valid_until < new Date().toISOString().slice(0, 10)) {
      return { ok: false as const, error: "This quotation has expired. Please contact us for an updated one." };
    }
    await env.DB.prepare("UPDATE quotes SET status = 'accepted', updated_at = datetime('now') WHERE id = ?").bind(r.id).run();
    await syncRequestStatus(r.id, "accepted");
    await notifyAdmin(`Quotation ${r.number} accepted by ${r.client_name}`, [
      ["Quotation", r.number],
      ["Client", r.client_name],
      ["Status", "Accepted on the website"],
    ]);
    return { ok: true as const };
  });
