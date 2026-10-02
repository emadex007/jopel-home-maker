-- Clients & partners logo slider, plus four SAMPLE testimonial templates.
-- The samples are switched OFF (active = 0) and clearly labelled so they never show as real reviews.
-- Replace them with real clients' words in Dashboard → Testimonials, then switch them on.

CREATE TABLE IF NOT EXISTS clients (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  name        TEXT NOT NULL,
  logo        TEXT NOT NULL DEFAULT '',
  url         TEXT NOT NULL DEFAULT '',
  sort_order  INTEGER NOT NULL DEFAULT 0,
  active      INTEGER NOT NULL DEFAULT 1,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

INSERT INTO testimonials (name, role, quote, sort_order, active) VALUES
  ('SAMPLE: replace with client name', 'e.g. Homeowner, Abuja', 'Replace this with what a real client said about working with Jo-pearl, for example how the finished space feels and what the experience was like.', 100, 0),
  ('SAMPLE: replace with client name', 'e.g. Apartment owner, Lagos', 'Replace this with a real client''s words, for example about the design process, communication and handover.', 101, 0),
  ('SAMPLE: replace with client name', 'e.g. Business owner', 'Replace this with a real client''s words about an office or commercial project.', 102, 0),
  ('SAMPLE: replace with client name', 'e.g. Short-let host', 'Replace this with a real client''s words, for example how the new interior affected their bookings or guests.', 103, 0);
