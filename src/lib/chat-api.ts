// Live chat server functions: the visitor widget (public, identified by a random token)
// and the dashboard Chat page (login required).
import { createServerFn } from "@tanstack/react-start";
import { env } from "~/lib/env";
import { notifyAdmin } from "~/server/db";
import { requireStaff } from "~/server/guard";

const str = (v: unknown, max = 500) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const int = (v: unknown) => (Number.isFinite(Number(v)) ? Math.trunc(Number(v)) : 0);
const ONLINE_WINDOW_MS = 3 * 60_000; // staff count as "online" if active in the last 3 minutes
const MAX_MSG = 2000;

export type ChatMessage = { id: number; sender: "visitor" | "staff"; staff_name: string; body: string; created_at: string };

async function staffOnline(): Promise<boolean> {
  try {
    const r = await env.DB.prepare("SELECT value FROM app_state WHERE key = 'staff_seen'").first<{ value: string }>();
    return !!r && Date.now() - Number(r.value) < ONLINE_WINDOW_MS;
  } catch {
    return false;
  }
}

async function markStaffSeen() {
  await env.DB.prepare(
    "INSERT INTO app_state (key, value, updated_at) VALUES ('staff_seen', ?, datetime('now')) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at",
  )
    .bind(String(Date.now()))
    .run();
}

const validToken = (t: string) => /^[0-9a-f]{32,64}$/.test(t);

async function convoByToken(token: string) {
  if (!validToken(token)) return null;
  return env.DB.prepare("SELECT id, name, status FROM chat_conversations WHERE visitor_token = ?").bind(token).first<{ id: number; name: string; status: string }>();
}

async function messagesAfter(conversationId: number, after: number) {
  const { results } = await env.DB.prepare(
    "SELECT id, sender, staff_name, body, created_at FROM chat_messages WHERE conversation_id = ? AND id > ? ORDER BY id LIMIT 200",
  )
    .bind(conversationId, after)
    .all<ChatMessage>();
  return results ?? [];
}

// ---------- visitor ----------

export const chatStart = createServerFn({ method: "POST" })
  .inputValidator((d: { name: string; contact: string; message: string; website?: string }) => d)
  .handler(async ({ data }) => {
    if (str(data.website)) return { ok: false as const, error: "Please try again." }; // bot honeypot
    const name = str(data.name, 80);
    const contact = str(data.contact, 160);
    const body = str(data.message, MAX_MSG);
    if (name.length < 2) return { ok: false as const, error: "Please tell us your name." };
    if (body.length < 2) return { ok: false as const, error: "Please type a message." };
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact);
    const token = [...crypto.getRandomValues(new Uint8Array(24))].map((b) => b.toString(16).padStart(2, "0")).join("");
    const res = await env.DB.prepare(
      "INSERT INTO chat_conversations (visitor_token, name, email, phone, unread_staff, last_message_at) VALUES (?, ?, ?, ?, 1, datetime('now'))",
    )
      .bind(token, name, isEmail ? contact : "", isEmail ? "" : contact)
      .run();
    const id = Number(res.meta.last_row_id);
    await env.DB.prepare("INSERT INTO chat_messages (conversation_id, sender, body) VALUES (?, 'visitor', ?)").bind(id, body).run();
    await notifyAdmin(`New chat from ${name}`, [
      ["Name", name],
      ["Contact", contact],
      ["Message", body],
      ["Reply", "Open the dashboard → Chat"],
    ]);
    return { ok: true as const, token, messages: await messagesAfter(id, 0), online: await staffOnline() };
  });

export const chatPoll = createServerFn({ method: "GET" })
  .inputValidator((d: { token: string; after: number }) => d)
  .handler(async ({ data }) => {
    const c = await convoByToken(str(data.token, 80));
    if (!c) return { ok: false as const };
    const messages = await messagesAfter(c.id, int(data.after));
    if (messages.some((m) => m.sender === "staff")) {
      await env.DB.prepare("UPDATE chat_conversations SET unread_visitor = 0 WHERE id = ?").bind(c.id).run();
    }
    return { ok: true as const, messages, online: await staffOnline(), closed: c.status === "closed" };
  });

export const chatSend = createServerFn({ method: "POST" })
  .inputValidator((d: { token: string; body: string }) => d)
  .handler(async ({ data }) => {
    const c = await convoByToken(str(data.token, 80));
    if (!c) return { ok: false as const, error: "This chat has ended. Please start a new one." };
    const body = str(data.body, MAX_MSG);
    if (!body) return { ok: false as const, error: "Please type a message." };
    // Simple flood protection: at most 12 messages a minute per conversation.
    const recent = await env.DB.prepare(
      "SELECT COUNT(*) AS n FROM chat_messages WHERE conversation_id = ? AND sender = 'visitor' AND created_at > datetime('now', '-60 seconds')",
    )
      .bind(c.id)
      .first<{ n: number }>();
    if ((recent?.n ?? 0) >= 12) return { ok: false as const, error: "You're sending messages too quickly. Please wait a moment." };
    await env.DB.batch([
      env.DB.prepare("INSERT INTO chat_messages (conversation_id, sender, body) VALUES (?, 'visitor', ?)").bind(c.id, body),
      env.DB.prepare("UPDATE chat_conversations SET unread_staff = unread_staff + 1, status = 'open', last_message_at = datetime('now') WHERE id = ?").bind(c.id),
    ]);
    return { ok: true as const };
  });

// ---------- dashboard ----------

export type Conversation = {
  id: number;
  name: string;
  email: string;
  phone: string;
  status: "open" | "closed";
  unread_staff: number;
  last_message_at: string;
  created_at: string;
  last_body: string;
  last_sender: string;
};

export const adminListConversations = createServerFn({ method: "GET" })
  .inputValidator((d: { status?: "open" | "closed" }) => d)
  .handler(async ({ data }) => {
    await requireStaff();
    await markStaffSeen();
    const where = data.status === "closed" ? "WHERE c.status = 'closed'" : data.status === "open" ? "WHERE c.status = 'open'" : "";
    const { results } = await env.DB.prepare(
      `SELECT c.id, c.name, c.email, c.phone, c.status, c.unread_staff, c.last_message_at, c.created_at,
         (SELECT body FROM chat_messages m WHERE m.conversation_id = c.id ORDER BY m.id DESC LIMIT 1) AS last_body,
         (SELECT sender FROM chat_messages m WHERE m.conversation_id = c.id ORDER BY m.id DESC LIMIT 1) AS last_sender
       FROM chat_conversations c ${where} ORDER BY c.last_message_at DESC LIMIT 200`,
    ).all<Conversation>();
    return results ?? [];
  });

export const adminGetConversation = createServerFn({ method: "GET" })
  .inputValidator((d: { id: number; after?: number }) => d)
  .handler(async ({ data }) => {
    await requireStaff();
    await markStaffSeen();
    const id = int(data.id);
    const c = await env.DB.prepare("SELECT id, name, email, phone, status, created_at FROM chat_conversations WHERE id = ?").bind(id).first<Omit<Conversation, "unread_staff" | "last_message_at" | "last_body" | "last_sender">>();
    if (!c) return null;
    await env.DB.prepare("UPDATE chat_conversations SET unread_staff = 0 WHERE id = ?").bind(id).run();
    return { conversation: c, messages: await messagesAfter(id, int(data.after ?? 0)) };
  });

export const adminSendChat = createServerFn({ method: "POST" })
  .inputValidator((d: { id: number; body: string }) => d)
  .handler(async ({ data }) => {
    const me = await requireStaff();
    await markStaffSeen();
    const body = str(data.body, MAX_MSG);
    if (!body) return { ok: false as const, error: "Type a reply first." };
    const id = int(data.id);
    await env.DB.batch([
      env.DB.prepare("INSERT INTO chat_messages (conversation_id, sender, staff_name, body) VALUES (?, 'staff', ?, ?)").bind(id, me.name.split(" ")[0], body),
      env.DB.prepare("UPDATE chat_conversations SET unread_visitor = unread_visitor + 1, status = 'open', last_message_at = datetime('now') WHERE id = ?").bind(id),
    ]);
    return { ok: true as const };
  });

export const adminSetChatStatus = createServerFn({ method: "POST" })
  .inputValidator((d: { id: number; status: "open" | "closed" }) => d)
  .handler(async ({ data }) => {
    await requireStaff();
    await env.DB.prepare("UPDATE chat_conversations SET status = ? WHERE id = ?").bind(data.status === "closed" ? "closed" : "open", int(data.id)).run();
    return { ok: true };
  });

export const adminDeleteConversation = createServerFn({ method: "POST" })
  .inputValidator((id: number) => int(id))
  .handler(async ({ data: id }) => {
    await requireStaff();
    await env.DB.batch([
      env.DB.prepare("DELETE FROM chat_messages WHERE conversation_id = ?").bind(id),
      env.DB.prepare("DELETE FROM chat_conversations WHERE id = ?").bind(id),
    ]);
    return { ok: true };
  });

/** Badge counts for the dashboard sidebar. Also keeps the "staff online" flag fresh. */
export const adminBadgeCounts = createServerFn({ method: "GET" }).handler(async () => {
  await requireStaff();
  await markStaffSeen();
  const r = await env.DB.prepare(
    `SELECT
       (SELECT COALESCE(SUM(unread_staff), 0) FROM chat_conversations) AS chat,
       (SELECT COUNT(*) FROM bookings WHERE status = 'new') + (SELECT COUNT(*) FROM quote_requests WHERE status = 'new')
         + (SELECT COUNT(*) FROM messages WHERE is_read = 0) AS inbox`,
  ).first<{ chat: number; inbox: number }>();
  return { chat: r?.chat ?? 0, inbox: r?.inbox ?? 0 };
});
