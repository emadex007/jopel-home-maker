// Password hashing and session handling for the admin dashboard. Server-only.
import { env } from "~/lib/env";

export const SESSION_COOKIE = "jp_session";
export const SESSION_DAYS = 30;

export type StaffUser = { id: number; name: string; email: string; role: "owner" | "staff" };

const enc = new TextEncoder();
const b64 = (buf: ArrayBuffer | Uint8Array) => btoa(String.fromCharCode(...new Uint8Array(buf)));
const unb64 = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
const hex = (buf: ArrayBuffer) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");

// Cloudflare Workers caps PBKDF2 at 100,000 iterations.
const ITERATIONS = 100_000;

async function pbkdf2(password: string, salt: Uint8Array, iterations: number) {
  const key = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveBits"]);
  return crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt: salt as unknown as BufferSource, iterations }, key, 256);
}

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const bits = await pbkdf2(password, salt, ITERATIONS);
  return `pbkdf2$${ITERATIONS}$${b64(salt)}$${b64(bits)}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [scheme, iter, saltB64, hashB64] = stored.split("$");
  if (scheme !== "pbkdf2" || !iter || !saltB64 || !hashB64) return false;
  const bits = new Uint8Array(await pbkdf2(password, unb64(saltB64), Number(iter)));
  const expected = unb64(hashB64);
  if (bits.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < bits.length; i++) diff |= bits[i] ^ expected[i];
  return diff === 0;
}

async function tokenHash(token: string) {
  return hex(await crypto.subtle.digest("SHA-256", enc.encode(token)));
}

/** Creates a session and returns the raw token to put in the cookie. Only the hash is stored. */
export async function createSession(staffId: number): Promise<string> {
  const raw = crypto.getRandomValues(new Uint8Array(32));
  const token = hex(raw.buffer as ArrayBuffer);
  const expires = new Date(Date.now() + SESSION_DAYS * 86400_000).toISOString();
  await env.DB.prepare("INSERT INTO sessions (token, staff_id, expires_at) VALUES (?, ?, ?)")
    .bind(await tokenHash(token), staffId, expires)
    .run();
  // Opportunistic cleanup of expired sessions.
  await env.DB.prepare("DELETE FROM sessions WHERE expires_at < ?").bind(new Date().toISOString()).run();
  return token;
}

export async function getStaffByToken(token: string | undefined | null): Promise<StaffUser | null> {
  if (!token || !/^[0-9a-f]{64}$/.test(token)) return null;
  const row = await env.DB.prepare(
    `SELECT s.id, s.name, s.email, s.role FROM sessions x JOIN staff s ON s.id = x.staff_id
     WHERE x.token = ? AND x.expires_at > ? AND s.active = 1`,
  )
    .bind(await tokenHash(token), new Date().toISOString())
    .first<StaffUser>();
  return row ?? null;
}

export async function deleteSession(token: string | undefined | null) {
  if (!token) return;
  await env.DB.prepare("DELETE FROM sessions WHERE token = ?").bind(await tokenHash(token)).run();
}

export async function staffCount(): Promise<number> {
  const r = await env.DB.prepare("SELECT COUNT(*) AS n FROM staff").first<{ n: number }>();
  return r?.n ?? 0;
}

/** Reads a cookie from a raw Request (used by the upload endpoint in src/server.ts). */
export function readCookie(request: Request, name: string): string | null {
  const header = request.headers.get("cookie") || "";
  for (const part of header.split(";")) {
    const [k, ...v] = part.trim().split("=");
    if (k === name) return decodeURIComponent(v.join("="));
  }
  return null;
}
