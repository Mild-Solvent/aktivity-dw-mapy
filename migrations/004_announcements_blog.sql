-- Announcements grow into blog posts.
--
-- body      — the article the admin writes; shown on /novinky/<id>. NULL/'' is
--             fine (a ticker-only one-liner is still a valid post).
-- in_ticker — whether the ants tow this post on the home page. `active`
--             remains the blog-visibility switch; the ticker shows rows with
--             active=1 AND in_ticker=1. Admin decides both.
--
-- Idempotent: MariaDB supports IF NOT EXISTS on ADD COLUMN.
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS body MEDIUMTEXT NULL;
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS in_ticker TINYINT(1) NOT NULL DEFAULT 1;
