-- Trail likes + password recovery.
--
-- Idempotent: safe to re-run, same as 001.

-- ── trail_likes ─────────────────────────────────────────────────────────
-- The composite primary key IS the "one like per person per trail" rule.
-- Enforcing it in the schema means a double-click or a replayed request
-- cannot double-count, which no application-level check can guarantee.
--
-- No foreign keys, matching the rest of the schema: sessions.email and
-- trails.created_by are unconstrained too. Rows are cleaned up explicitly
-- when a trail is deleted (api/trails/id.php).
CREATE TABLE IF NOT EXISTS trail_likes (
  email       VARCHAR(255) NOT NULL,
  trail_id    VARCHAR(120) NOT NULL,
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (email, trail_id),
  INDEX idx_trail (trail_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── password_resets ─────────────────────────────────────────────────────
-- token_hash holds sha256(token), never the token itself: whoever can read
-- this table still cannot take over an account with what they find.
--
-- The table doubles as the rate-limit ledger. Every request is recorded,
-- including ones for addresses that do not exist, so a flood of requests is
-- counted whether or not it names a real account -- see api/auth/forgot-password.php.
-- requested_ip is stored for that purpose only.
CREATE TABLE IF NOT EXISTS password_resets (
  token_hash   CHAR(64) NOT NULL PRIMARY KEY,
  email        VARCHAR(255) NOT NULL,
  requested_ip VARCHAR(45) NULL,             -- 45 = max INET6_ADDRSTRLEN
  created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at   TIMESTAMP NOT NULL,
  used_at      TIMESTAMP NULL,
  INDEX idx_email_created (email, created_at),
  INDEX idx_ip_created (requested_ip, created_at),
  INDEX idx_expires (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
