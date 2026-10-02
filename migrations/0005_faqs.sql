-- Frequently asked questions, editable in Dashboard → FAQs.
-- The starter answers are deliberately general (no prices or promises). Review and adjust them to match how the business works.
CREATE TABLE IF NOT EXISTS faqs (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  question    TEXT NOT NULL,
  answer      TEXT NOT NULL,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  active      INTEGER NOT NULL DEFAULT 1,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

INSERT INTO faqs (question, answer, sort_order) VALUES
  ('How much does an interior project cost?', 'Every space is different, so the cost depends on the size of the space, the scope of work and the materials and furniture you choose. Tell us about your project on the Request a Quote page and we''ll send you a clear, itemised quotation.', 0),
  ('How long does a project take?', 'It depends on the scope. Styling a single room is quicker than a full renovation. We agree a timeline with you before work starts and keep you updated at every stage.', 1),
  ('Do you visit the site before quoting?', 'Yes, a site visit or a call helps us understand your space and give you an accurate quotation. You can book one on the Book a Consultation page.', 2),
  ('Can I keep some of my existing furniture?', 'Of course. We can design around pieces you love and suggest how to restyle them so they fit the new look.', 3),
  ('Do you work on offices and commercial spaces?', 'Yes. Alongside homes and apartments, we design and decorate offices, shops, restaurants and short-let apartments.', 4),
  ('How do I get started?', 'Send us a message on the chat, request a quote or book a consultation. We''ll get back to you to talk through your ideas.', 5);
