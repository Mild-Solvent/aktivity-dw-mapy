-- aktivity-dw-mapy schema for MariaDB (Websupport).
--
-- Replaces the Upstash Redis key layout (trails:<id>, users:<email>,
-- sessions:<token>) with three tables. The trail payload stays a JSON
-- column so the TRAIL_FIELDS allowlist in api/_lib/trails.php is the only
-- gate on shape — no schema migration is needed when fields evolve.
--
-- Idempotent: safe to re-run in phpMyAdmin.

-- ── trails ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS trails (
  id          VARCHAR(120) NOT NULL PRIMARY KEY,
  payload     JSON NOT NULL,
  created_by  VARCHAR(255) NULL,
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
              ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── users ───────────────────────────────────────────────────────────────
-- password_hash stores the self-describing "pbkdf2$<iter>$<salt-b64>$<hash-b64>"
-- format produced by the old Node app. PHP's hash_pbkdf2('sha256', ...)
-- verifies those hashes byte-for-byte, so accounts port without resets.
CREATE TABLE IF NOT EXISTS users (
  email         VARCHAR(255) NOT NULL PRIMARY KEY,
  password_hash VARCHAR(255) NOT NULL,
  role          ENUM('admin','trails_adder','user') NOT NULL DEFAULT 'user',
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── sessions ────────────────────────────────────────────────────────────
-- Replaces Redis sessions:<token> keys with TTL. expires_at drives both
-- validity checks (WHERE expires_at > NOW()) and the opportunistic cleanup
-- in api/_lib/sessions.php.
CREATE TABLE IF NOT EXISTS sessions (
  token       VARCHAR(64) NOT NULL PRIMARY KEY,
  email       VARCHAR(255) NOT NULL,
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at  TIMESTAMP NOT NULL,
  INDEX idx_expires (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
