#!/usr/bin/env node
// Turns a copy of this project into a new client's website.
// Usage (from the project folder):  npm run new-client
//
// It renames the Worker, database and photo bucket, and swaps the business name, short name,
// tagline and email throughout the default content. Everything else (colours, text, photos)
// is then edited in the dashboard.

import { readFileSync, writeFileSync, existsSync, rmSync } from "node:fs";
import { createInterface } from "node:readline";
import { stdin as input, stdout as output } from "node:process";

// Line-by-line answers (works when typing, pasting several lines, or piping answers in).
const rl = createInterface({ input, terminal: false });
const queue = [];
let waiting = null;
let closed = false;
rl.on("line", (l) => (waiting ? (waiting(l), (waiting = null)) : queue.push(l)));
rl.on("close", () => {
  closed = true;
  if (waiting) waiting("");
});
const nextLine = () => (queue.length ? Promise.resolve(queue.shift()) : closed ? Promise.resolve("") : new Promise((r) => (waiting = r)));
const ask = async (q, def = "") => {
  output.write(def ? `${q} [${def}]: ` : `${q}: `);
  const a = (await nextLine()).trim();
  if (!input.isTTY) output.write((a || def) + "\n");
  return a || def;
};
const slugify = (s) =>
  s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);

const read = (f) => readFileSync(f, "utf8");
const write = (f, s) => writeFileSync(f, s);
const escRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const replaceAll = (s, from, to) => (from ? s.replace(new RegExp(escRe(from), "g"), to) : s);

// ---- what the project is currently set up as ----
const wrangler = read("wrangler.toml");
const defaults = read("src/lib/site-defaults.ts");
const oldWorker = wrangler.match(/^name\s*=\s*"([^"]+)"/m)?.[1] ?? "";
const oldDb = wrangler.match(/database_name\s*=\s*"([^"]+)"/)?.[1] ?? "";
const oldBucket = wrangler.match(/bucket_name\s*=\s*"([^"]+)"/)?.[1] ?? "";
const brandBlock = defaults.slice(defaults.indexOf("export const SITE_DEFAULTS"));
const oldName = brandBlock.match(/name:\s*"([^"]+)"/)?.[1] ?? "";
const oldTagline = brandBlock.match(/tagline:\s*"([^"]+)"/)?.[1] ?? "";
const oldEmail = brandBlock.match(/email:\s*"([^"]+@[^"]+)"/)?.[1] ?? "";
const oldShort = brandBlock.match(/introEyebrow:\s*"Welcome to ([^"]+)"/)?.[1] ?? oldName.split(" ")[0];

console.log(`\nCurrently set up as: ${oldName} (Worker "${oldWorker}")\n`);

const name = await ask("New business name", "");
if (!name) {
  console.log("No name given. Nothing changed.");
  process.exit(0);
}
const short = await ask("Short name (used in 'Welcome to …')", name.split(" ")[0]);
const tagline = await ask("Tagline", "");
const slug = slugify(await ask("Project ID (lowercase, dashes)", slugify(name)));
const email = await ask("Business email", `hello@${slug.replace(/-/g, "")}.com`);
const confirm = (await ask(`\nRename everything to "${name}" (${slug})? y/n`, "y")).toLowerCase();
if (confirm !== "y") {
  console.log("Cancelled. Nothing changed.");
  process.exit(0);
}

const db = slug.replace(/-/g, "_") + "_db";
const bucket = `${slug}-media`;

// ---- wrangler.toml ----
let w = wrangler;
w = w.replace(/^name\s*=\s*"[^"]+"/m, `name = "${slug}"`);
w = replaceAll(w, oldDb, db);
w = replaceAll(w, oldBucket, bucket);
w = w.replace(/database_id\s*=\s*"[^"]*"/, 'database_id = "PASTE_DATABASE_ID_HERE"');
w = w.replace(/pattern = "(www\.)?[^"]+"/g, (_m, www) => `pattern = "${www ?? ""}${slug.replace(/-/g, "")}.com"`);
w = w.replace(/^# .*served on the workers\.dev URL first$/m, `# ${name}: served on the workers.dev URL first`);
w = w.replace(/^# --- Custom domain: uncomment once .*$/m, "# --- Custom domain: uncomment once the client's domain is linked to Cloudflare ---");
write("wrangler.toml", w);

// ---- package.json ----
let p = read("package.json");
p = p.replace(/"name":\s*"[^"]+"/, `"name": "${slug}"`);
p = replaceAll(p, oldDb, db);
write("package.json", p);

// ---- default site content ----
let d = defaults;
d = replaceAll(d, oldName, name);
if (oldShort && oldShort !== oldName) d = replaceAll(d, oldShort, short);
if (oldTagline) d = replaceAll(d, oldTagline, tagline);
if (oldEmail) d = replaceAll(d, oldEmail, email);
write("src/lib/site-defaults.ts", d);

// ---- README title ----
if (existsSync("README.md")) {
  let r = read("README.md");
  r = r.replace(/^# .*$/m, `# ${name}`);
  if (oldTagline) r = replaceAll(r, oldTagline, tagline);
  r = replaceAll(r, oldName, name);
  r = replaceAll(r, oldWorker, slug);
  r = replaceAll(r, oldDb, db);
  r = replaceAll(r, oldBucket, bucket);
  write("README.md", r);
}

// ---- local test data belongs to the old client ----
if (existsSync(".wrangler")) {
  const wipe = (await ask("Delete the old client's local test database (.wrangler folder)? y/n", "y")).toLowerCase();
  if (wipe === "y") rmSync(".wrangler", { recursive: true, force: true });
}
rl.close();

console.log(`
Done. "${name}" is ready to set up. Next:

  npx wrangler d1 create ${db}          (paste the database_id into wrangler.toml)
  npx wrangler r2 bucket create ${bucket}
  npm run db:migrate:local
  npm run dev                                (test at http://localhost:3000)

Go live:
  npm run db:migrate:remote
  npx wrangler secret put ADMIN_SETUP_CODE
  npm run deploy

Then log in at /admin and set up the client's logo, colours, contact details and content.
See TEMPLATE.md for what to change per industry.
`);
