-- Core schema
-- Apply locally:  npm run db:migrate:local
-- Apply live:     npm run db:migrate:remote

-- Site settings: one JSON blob per section (theme, header, footer, home, about, contact, social, seo).
-- Anything missing falls back to the defaults in src/lib/site-defaults.ts.
CREATE TABLE IF NOT EXISTS settings (
  key         TEXT PRIMARY KEY,
  value       TEXT NOT NULL,
  updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS services (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  slug        TEXT NOT NULL UNIQUE,
  title       TEXT NOT NULL,
  summary     TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  image       TEXT NOT NULL DEFAULT '',
  sort_order  INTEGER NOT NULL DEFAULT 0,
  active      INTEGER NOT NULL DEFAULT 1,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Portfolio projects. Each project has its own page at /portfolio/<slug>.
CREATE TABLE IF NOT EXISTS projects (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  slug        TEXT NOT NULL UNIQUE,
  title       TEXT NOT NULL,
  category    TEXT NOT NULL DEFAULT 'Residential',
  location    TEXT NOT NULL DEFAULT '',
  year        TEXT NOT NULL DEFAULT '',
  duration    TEXT NOT NULL DEFAULT '',
  scope       TEXT NOT NULL DEFAULT '',
  summary     TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  cover_image TEXT NOT NULL DEFAULT '',
  featured    INTEGER NOT NULL DEFAULT 0,
  published   INTEGER NOT NULL DEFAULT 1,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_projects_published ON projects (published, sort_order);

CREATE TABLE IF NOT EXISTS project_photos (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id  INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  url         TEXT NOT NULL,
  caption     TEXT NOT NULL DEFAULT '',
  sort_order  INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_photos_project ON project_photos (project_id, sort_order);

CREATE TABLE IF NOT EXISTS testimonials (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  name        TEXT NOT NULL,
  role        TEXT NOT NULL DEFAULT '',
  quote       TEXT NOT NULL,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  active      INTEGER NOT NULL DEFAULT 1
);

-- Consultation / site-visit bookings
CREATE TABLE IF NOT EXISTS bookings (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  ref            TEXT NOT NULL UNIQUE,
  name           TEXT NOT NULL,
  email          TEXT NOT NULL DEFAULT '',
  phone          TEXT NOT NULL,
  service        TEXT NOT NULL DEFAULT '',
  visit_type     TEXT NOT NULL DEFAULT 'Site visit',
  preferred_date TEXT NOT NULL DEFAULT '',
  preferred_time TEXT NOT NULL DEFAULT '',
  address        TEXT NOT NULL DEFAULT '',
  notes          TEXT NOT NULL DEFAULT '',
  status         TEXT NOT NULL DEFAULT 'new',   -- new | confirmed | done | cancelled
  created_at     TEXT NOT NULL DEFAULT (datetime('now'))
);

-- What a visitor sends from the "Request a quote" page
CREATE TABLE IF NOT EXISTS quote_requests (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  ref          TEXT NOT NULL UNIQUE,
  name         TEXT NOT NULL,
  email        TEXT NOT NULL DEFAULT '',
  phone        TEXT NOT NULL,
  project_type TEXT NOT NULL DEFAULT '',
  spaces       TEXT NOT NULL DEFAULT '',   -- comma list: Living room, Kitchen, ...
  size         TEXT NOT NULL DEFAULT '',
  budget       TEXT NOT NULL DEFAULT '',
  style        TEXT NOT NULL DEFAULT '',
  location     TEXT NOT NULL DEFAULT '',
  timeline     TEXT NOT NULL DEFAULT '',
  details      TEXT NOT NULL DEFAULT '',
  attachments  TEXT NOT NULL DEFAULT '[]', -- JSON array of /media/... URLs
  status       TEXT NOT NULL DEFAULT 'new', -- new | quoted | won | lost
  created_at   TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Quotations drafted by admin (Phase 3 builder)
CREATE TABLE IF NOT EXISTS quotes (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  number           TEXT NOT NULL UNIQUE,
  quote_request_id INTEGER REFERENCES quote_requests(id) ON DELETE SET NULL,
  client_name      TEXT NOT NULL,
  client_email     TEXT NOT NULL DEFAULT '',
  client_phone     TEXT NOT NULL DEFAULT '',
  client_address   TEXT NOT NULL DEFAULT '',
  items            TEXT NOT NULL DEFAULT '[]', -- JSON [{description, qty, unit, rate}]
  discount         REAL NOT NULL DEFAULT 0,
  tax_rate         REAL NOT NULL DEFAULT 0,
  notes            TEXT NOT NULL DEFAULT '',
  valid_until      TEXT NOT NULL DEFAULT '',
  status           TEXT NOT NULL DEFAULT 'draft', -- draft | sent | accepted | declined
  public_token     TEXT NOT NULL UNIQUE,
  created_at       TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at       TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Contact form messages + emails received through Cloudflare Email Routing
CREATE TABLE IF NOT EXISTS messages (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  source      TEXT NOT NULL DEFAULT 'form', -- form | email
  name        TEXT NOT NULL DEFAULT '',
  email       TEXT NOT NULL DEFAULT '',
  phone       TEXT NOT NULL DEFAULT '',
  subject     TEXT NOT NULL DEFAULT '',
  body        TEXT NOT NULL DEFAULT '',
  is_read     INTEGER NOT NULL DEFAULT 0,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Live chat (Phase 3)
CREATE TABLE IF NOT EXISTS chat_conversations (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  visitor_token   TEXT NOT NULL UNIQUE,
  name            TEXT NOT NULL DEFAULT '',
  email           TEXT NOT NULL DEFAULT '',
  phone           TEXT NOT NULL DEFAULT '',
  status          TEXT NOT NULL DEFAULT 'open', -- open | closed
  unread_staff    INTEGER NOT NULL DEFAULT 0,
  unread_visitor  INTEGER NOT NULL DEFAULT 0,
  last_message_at TEXT NOT NULL DEFAULT (datetime('now')),
  created_at      TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS chat_messages (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  conversation_id INTEGER NOT NULL REFERENCES chat_conversations(id) ON DELETE CASCADE,
  sender          TEXT NOT NULL, -- visitor | staff
  staff_name      TEXT NOT NULL DEFAULT '',
  body            TEXT NOT NULL,
  created_at      TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_chat_msgs ON chat_messages (conversation_id, id);

-- Admin / staff accounts (Phase 2)
CREATE TABLE IF NOT EXISTS staff (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  name          TEXT NOT NULL,
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role          TEXT NOT NULL DEFAULT 'staff', -- owner | staff
  active        INTEGER NOT NULL DEFAULT 1,
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS sessions (
  token      TEXT PRIMARY KEY,
  staff_id   INTEGER NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  expires_at TEXT NOT NULL
);
