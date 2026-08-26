-- News-ticker announcements (the ants on the home page tow these).
--
-- Idempotent: safe to re-run, same as 001/002.
--
-- kind='text'  → `text` is the message shown in the ticker card.
-- kind='image' → `media_url` points under /tracks/announcements/ (uploaded via
--                /api/upload with trailId "announcements"); `text` doubles as
--                the alt text. The folder name is reserved in api/trails/id.php
--                so a trail can never claim it and wipe the files on delete.
--
-- No foreign keys, matching the rest of the schema. Ordering is by
-- sort_order (admin-controlled), then id.
CREATE TABLE IF NOT EXISTS announcements (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  kind        VARCHAR(10)  NOT NULL DEFAULT 'text',
  text        VARCHAR(300) NOT NULL DEFAULT '',
  media_url   VARCHAR(500) NOT NULL DEFAULT '',
  link_url    VARCHAR(500) NOT NULL DEFAULT '',
  active      TINYINT(1)   NOT NULL DEFAULT 1,
  sort_order  INT          NOT NULL DEFAULT 0,
  created_by  VARCHAR(255) NOT NULL DEFAULT '',
  created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_active_sort (active, sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
