# Using this project as a template

This site was built for Jo-pearl Home Maker, but nothing about the client is hard-wired: names, colours, text, photos and contact details all come from the dashboard. You can reuse the whole thing for any business that sells services and shows a portfolio, such as interior designers, furniture makers, architects, builders, real-estate agents, event decorators, photographers, salons or cleaning companies.

## What every new client gets

- Public site: home, about, services, portfolio with a page and gallery per project, booking, quote request (with photo uploads), contact, FAQs
- Live chat (with a WhatsApp link) answered from the dashboard
- Quotation builder: send quotes by WhatsApp or email; clients view, print and accept online
- Testimonials slider and clients & partners logo strip
- Dashboard with logins: inbox, chat, quotations, projects, services, testimonials, client logos, FAQs, site settings (colours, fonts, sizes, header, footer, every page's text), staff, backups
- Weekly automatic database backups, sitemap, branded emails
- Runs on Cloudflare's free tier (Workers, D1, R2)

## Start a new client (about 15 minutes)

1. **Copy the project.** Either:
   - on GitHub, open this repo's **Settings** and tick **Template repository**, then click **Use this template** to create `emadex007/<new-client>`, and clone it; or
   - copy the folder, leaving out `node_modules`, `.wrangler`, `.dev.vars` and `.git`, then run `git init`.

2. **Rename everything for the new client:**
   ```powershell
   cd C:\Users\LENOVO\Documents\GitHub\<new-client>
   nvm use 22
   npm install
   npm run new-client
   ```
   It asks for the business name, short name, tagline, a project ID and email, then renames the Worker, database and photo bucket and updates the default text.

3. **Create their Cloudflare resources and test:**
   ```powershell
   npx wrangler d1 create <project_id>_db          # paste the database_id into wrangler.toml
   npx wrangler r2 bucket create <project-id>-media
   Set-Content -Path .dev.vars -Value "ADMIN_SETUP_CODE=<pick-a-code>" -Encoding ascii
   npm run db:migrate:local
   npm run dev
   ```

4. **Go live:**
   ```powershell
   npm run db:migrate:remote
   npx wrangler secret put ADMIN_SETUP_CODE
   npm run deploy
   ```
   Open `https://<project-id>.<your-subdomain>.workers.dev/admin`, create the owner account, and hand the login over to the client.

## Adapting it to a different industry

Most of this happens in the dashboard, so nothing needs to be coded:

| Change | Where |
|---|---|
| Logo, colours (5 presets), fonts, sizes | Site settings → Brand / Colours & fonts / Sizes & layout |
| Home banner, welcome text, "How we work" steps | Site settings → Home banner / Home page |
| About story and values | Site settings → About page |
| Page titles and banners | Site settings → Other pages |
| Services offered | Services |
| Portfolio | Projects (delete the samples first) |
| FAQs | FAQs (review the starter answers) |
| Quotation terms, validity, number prefix | Site settings → Quotations |
| Menu links and header button | Site settings → Header |

A few things live in the code and are worth adjusting for a very different business:

| What | File |
|---|---|
| Default text for a brand-new site (before anything is saved in the dashboard) | `src/lib/site-defaults.ts` |
| Quote form options: project types, spaces, styles, budget ranges | `src/routes/quote.tsx` (top of the file) |
| Booking form: appointment types and time slots | `src/routes/book.tsx` (top of the file) |
| Sample projects, services and photos for day one | `migrations/0002_seed_sample_content.sql` |
| Starter FAQs | `migrations/0005_faqs.sql` |

If you change the seed migrations for a new client, do it **before** the first `db:migrate` run.

## Before handing over

- Replace sample projects with the client's real work
- Real phone, WhatsApp, email and address (Site settings → Contact & social)
- Real testimonials and client logos only (the samples are switched off and labelled)
- Optional: Resend secrets for email notifications, the client's domain, and Cloudflare Web Analytics
