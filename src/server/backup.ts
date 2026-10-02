// Database backups: every table is written as a restorable .sql file to the R2 bucket under backups/.
// Runs weekly from the cron trigger in wrangler.toml, or on demand from Dashboard → Backups.
import type { AppEnv } from "~/lib/env";

export const BACKUP_PREFIX = "backups/";
const KEEP = 8; // keep the 8 most recent backups (2 months of weekly backups)
const SKIP = new Set(["sessions", "d1_migrations", "app_state"]); // login sessions & internal state aren't worth restoring

function sqlValue(v: unknown): string {
  if (v === null || v === undefined) return "NULL";
  if (typeof v === "number") return Number.isFinite(v) ? String(v) : "NULL";
  if (typeof v === "bigint") return v.toString();
  if (typeof v === "boolean") return v ? "1" : "0";
  if (v instanceof ArrayBuffer || ArrayBuffer.isView(v)) {
    const bytes = new Uint8Array(v instanceof ArrayBuffer ? v : (v as ArrayBufferView).buffer);
    return `X'${[...bytes].map((b) => b.toString(16).padStart(2, "0")).join("")}'`;
  }
  return `'${String(v).replace(/'/g, "''")}'`;
}

const quoteIdent = (name: string) => `"${name.replace(/"/g, '""')}"`;

export async function runBackup(env: AppEnv, label = "auto"): Promise<{ key: string; tables: number; rows: number; bytes: number }> {
  const { results: tables } = await env.DB.prepare(
    "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_cf_%' ORDER BY name",
  ).all<{ name: string }>();

  const now = new Date();
  const parts: string[] = [
    `-- Database backup (${label}) taken ${now.toISOString()}`,
    "-- Restore (replaces the data in these tables):",
    "--   npx wrangler d1 execute <database_name> --remote --file <this file>",
    "PRAGMA defer_foreign_keys = true;",
  ];
  const deletes: string[] = [];
  const inserts: string[] = [];
  let rows = 0;
  let count = 0;

  for (const { name } of tables ?? []) {
    if (SKIP.has(name)) continue;
    count++;
    const t = quoteIdent(name);
    deletes.push(`DELETE FROM ${t};`);
    inserts.push("", `-- ${name}`);
    const PAGE = 500;
    for (let offset = 0; ; offset += PAGE) {
      const { results } = await env.DB.prepare(`SELECT * FROM ${t} LIMIT ? OFFSET ?`).bind(PAGE, offset).all<Record<string, unknown>>();
      const batch = results ?? [];
      for (const row of batch) {
        const cols = Object.keys(row);
        inserts.push(`INSERT INTO ${t} (${cols.map(quoteIdent).join(", ")}) VALUES (${cols.map((c) => sqlValue(row[c])).join(", ")});`);
      }
      rows += batch.length;
      if (batch.length < PAGE) break;
    }
  }
  // Clear every table first, then insert, so cascading deletes can't remove rows we just restored.
  parts.push("", "-- clear current data", ...deletes, ...inserts, "");

  const body = parts.join("\n");
  const stamp = now.toISOString().slice(0, 16).replace("T", "_").replace(":", "-");
  const key = `${BACKUP_PREFIX}${stamp}_${label}.sql`;
  await env.MEDIA.put(key, body, { httpMetadata: { contentType: "application/sql; charset=utf-8" } });
  await pruneBackups(env);
  return { key, tables: count, rows, bytes: body.length };
}

export async function listBackups(env: AppEnv) {
  const list = await env.MEDIA.list({ prefix: BACKUP_PREFIX, limit: 100 });
  return list.objects
    .map((o) => ({ key: o.key, name: o.key.slice(BACKUP_PREFIX.length), size: o.size, uploaded: o.uploaded.toISOString() }))
    .sort((a, b) => b.uploaded.localeCompare(a.uploaded));
}

async function pruneBackups(env: AppEnv) {
  const all = await listBackups(env);
  for (const old of all.slice(KEEP)) await env.MEDIA.delete(old.key);
}
