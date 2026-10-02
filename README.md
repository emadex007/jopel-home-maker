# Jo-pearl Home Maker

*...experience the difference*

Interior design & decoration website: portfolio with a page per project, consultation booking, quote requests with photo uploads, contact form, inbound email inbox and WhatsApp/social links. Every colour, size, header, footer and page text is driven by settings that the admin dashboard will edit.

Built by Emadex Creations on the same stack as Ronia Logistics: **TanStack Start + Cloudflare Workers + D1 + R2 + Tailwind v4**.

## Build phases

| Phase | Scope | Status |
|---|---|---|
| 1 | Database, public site, portfolio + project galleries, booking, quote request, contact, WhatsApp, settings-driven theme | ✅ Done |
| 2 | Admin dashboard: login, projects & photo uploads (R2), services, testimonials, **site settings editor** (colours, fonts, sizes, header, footer, page text) with live preview, inbox, staff accounts | ✅ Done |
| 3 | **Quotation builder** (from a quote request, optional VAT, valid-until, client link to view/print/accept, send by WhatsApp or email), **live chat** (bubble bottom-right, WhatsApp bottom-left, replies from the dashboard) | ✅ Done |
| 4 | `sitemap.xml` + `robots.txt`, branded notification & quotation emails, share buttons on project pages | ✅ Done |
| 5 | FAQs (home, contact, Google FAQ data), weekly automatic backups (Dashboard → Backups), reusable template (`npm run new-client`, see TEMPLATE.md) | ✅ Done |

## First-time setup (Windows, same as Ronia)

```powershell
cd C:\Users\LENOVO\Documents\GitHub\jopel-home-maker
nvm use 22
npm install

# 1. Create the database, then paste the database_id into wrangler.toml
npx wrangler d1 create jopearl_home_maker_db

# 2. Create the media bucket
npx wrangler r2 bucket create jopearl-home-maker-media

# 3. Create tables + sample content (locally and live)
npm run db:migrate:local
npm run db:migrate:remote

# 4. Run it
npm run dev        # http://localhost:3000

# 5. Deploy to workers.dev
npm run deploy
```

## Admin dashboard

The dashboard lives at **/admin** (e.g. `http://localhost:3000/admin`).

The first time, you create the owner account with a setup code, so nobody else can claim the dashboard on a fresh deploy:

```powershell
# Local: create a file called .dev.vars in the project folder with this line
ADMIN_SETUP_CODE=pick-a-long-secret-code

# Live: set the same kind of code as a secret
npx wrangler secret put ADMIN_SETUP_CODE
```

Then open `/admin`, enter the setup code, your name, email and password. After that, log in with email + password. The owner can add staff logins under **Staff & account**.

Local and live are separate databases, so you create the owner once locally and once on the live site.

### Quotations

Inbox → open a quote request → **Create quotation** (client details are filled in), or Quotations → **New quotation**.
Add items, an optional discount and VAT, check the valid-until date (default set in Site settings → Quotations), then **Create quotation**.
Send it with **Send on WhatsApp** or **Send by email** (needs Resend). The client gets a private link (`/q/...`) where they can view, print / save as PDF, accept, or ask a question on WhatsApp. Accepting notifies you and marks the quote request as won.

### Live chat

Visitors chat from the bubble at the bottom-right of the site (the WhatsApp link is inside the chat window). Replies happen in **Live chat** in the dashboard. While anyone has the dashboard open, the chat shows "Online now"; otherwise visitors see the away message from Site settings → Live chat.

### Optional: email notifications (Resend)

```powershell
npx wrangler secret put RESEND_API_KEY
npx wrangler secret put ADMIN_NOTIFY_EMAIL   # where new bookings/quotes/messages are sent
```

Until a domain is verified in Resend, emails send from `onboarding@resend.dev`. After verifying, add `RESEND_FROM = "Jo-pearl Home Maker <hello@theirdomain.com>"` under `[vars]`.

For local dev, put the same keys in a `.dev.vars` file (already git-ignored).

### Optional: receive emails into the dashboard

Once they have a domain on Cloudflare: **Email → Email Routing → Routing rules → Send to a Worker → jopearl-home-maker**. Emails land in the `messages` table (and are forwarded to `ADMIN_NOTIFY_EMAIL` if set).

## Before launch: replace sample content

`migrations/0002_seed_sample_content.sql` adds **sample** projects and services with Unsplash photos so the site isn't empty. These are placeholders, not Jo-pearl's real work. Replace them with real projects from the dashboard (Phase 2) before sharing the site publicly. Also update the phone, WhatsApp, email and address (currently placeholders in `src/lib/site-defaults.ts`, editable from the dashboard in Phase 2).

Testimonials: four SAMPLE templates are added switched off. Replace them with real clients' words in **Testimonials**, then switch them on, and they slide across the home page. **Clients & partners** logos scroll across the home page once real logos are added. The stats row stays hidden until real figures are added in **Site settings → Home page**.

## Where things live

| Path | What |
|---|---|
| `src/lib/site-defaults.ts` | Every editable setting + its default value |
| `src/server/db.ts` | D1 queries, email notifications |
| `src/lib/api.ts` | Server functions used by pages (reads + form submissions) |
| `src/server.ts` | Worker entry: `/media/*` from R2, `/api/upload`, `/robots.txt`, `/sitemap.xml`, inbound email |
| `src/routes/` | Pages: `/`, `/about`, `/services`, `/portfolio`, `/portfolio/$slug`, `/book`, `/quote`, `/contact` |
| `src/components/` | Header, Footer, WhatsApp button, Lightbox, project cards, forms |
| `src/routes/admin*.tsx` | Dashboard pages (login, overview, inbox, projects, services, testimonials, settings, staff) |
| `src/lib/admin-api.ts` | Dashboard server functions (every one checks the login session) |
| `src/server/auth.ts` | Password hashing (PBKDF2) and sessions |
| `src/components/admin/` | Dashboard UI kit + the settings editor schema (add a field there and it shows up in the editor) |
| `src/lib/quotes-api.ts`, `src/lib/quote-calc.ts` | Quotations (dashboard + client page `/q/$token`) |
| `src/lib/chat-api.ts`, `src/components/ChatWidget.tsx` | Live chat (visitor widget + dashboard) |
| `src/server/backup.ts` | Weekly `.sql` backups to R2 (`[triggers]` in wrangler.toml) |
| `scripts/new-client.mjs`, `TEMPLATE.md` | Reuse this project for another client |
| `migrations/` | D1 schema + sample content |
