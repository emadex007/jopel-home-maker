# Jo-pearl Home Maker

*...experience the difference*

Interior design & decoration website: portfolio with a page per project, consultation booking, quote requests with photo uploads, contact form, inbound email inbox and WhatsApp/social links. Every colour, size, header, footer and page text is driven by settings that the admin dashboard will edit.

Built by Emadex Creations on the same stack as Ronia Logistics: **TanStack Start + Cloudflare Workers + D1 + R2 + Tailwind v4**.

## Build phases

| Phase | Scope | Status |
|---|---|---|
| 1 | Database, public site, portfolio + project galleries, booking, quote request, contact, WhatsApp, settings-driven theme | ✅ Done |
| 2 | Admin dashboard: login, projects & photo uploads (R2), services, testimonials, **site settings editor** (colours, fonts, sizes, header, footer, page text) with live preview, inbox, staff accounts | ✅ Done |
| 3 | **Quotation builder** (email + printable PDF), **live chat** widget + admin replies | Next |
| 4 | Polish: SEO/sitemap, email templates, custom domain | |

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

Testimonials and the stats row are intentionally empty and stay hidden until real ones are added. Add them under **Testimonials** and **Site settings → Home page** in the dashboard.

## Where things live

| Path | What |
|---|---|
| `src/lib/site-defaults.ts` | Every editable setting + its default value |
| `src/server/db.ts` | D1 queries, email notifications |
| `src/lib/api.ts` | Server functions used by pages (reads + form submissions) |
| `src/server.ts` | Worker entry: `/media/*` from R2, `/api/upload`, inbound email |
| `src/routes/` | Pages: `/`, `/about`, `/services`, `/portfolio`, `/portfolio/$slug`, `/book`, `/quote`, `/contact` |
| `src/components/` | Header, Footer, WhatsApp button, Lightbox, project cards, forms |
| `src/routes/admin*.tsx` | Dashboard pages (login, overview, inbox, projects, services, testimonials, settings, staff) |
| `src/lib/admin-api.ts` | Dashboard server functions (every one checks the login session) |
| `src/server/auth.ts` | Password hashing (PBKDF2) and sessions |
| `src/components/admin/` | Dashboard UI kit + the settings editor schema (add a field there and it shows up in the editor) |
| `migrations/` | D1 schema + sample content |
