-- Editable page content (a very small CMS).
CREATE TABLE pages (
  slug TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Contact form messages.
-- Cleanup: messages hold personal data. Delete them in the admin area once handled.
CREATE TABLE messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_messages_created_at ON messages (created_at);

INSERT INTO pages (slug, title, body)
VALUES ('home', 'It works', 'This text comes from the database. Change it in the admin area at /admin.');
