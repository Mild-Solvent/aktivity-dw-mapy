# TrackFinder — Activity Tracks Discovery

Slovak-language single-page app for discovering outdoor activity tracks (running, cycling, hiking) in Slovakia. Filterable grid of trails, per-track detail pages with stats and GPX download, and a small admin back-office for managing trails and user roles.

Branding: *Hľadač aktivitných trás*, built in cooperation with [CEA Europe](https://new.ceaeurope.sk/).

## Tech stack

**Frontend** — Vue 3 + Vue Router 4 + Vite. No state library (state lives in `App.vue`). Client-side GPX→preview-image renderer composites OpenStreetMap tiles (`src/utils/gpxMapCapture.js`).

**Backend** — PHP 8 handlers under `api/` + MariaDB. Apache routes `/api/*` to PHP via `.htaccess` and serves the built SPA + uploaded files directly. Custom email/password auth (PBKDF2/SHA-256), three roles, sessions in a DB table.

**Hosting** — Websupport (one origin for SPA + API + DB + files, so no CORS and no cross-domain cookies).

## Project layout

```
├── api/                    PHP backend
│   ├── bootstrap.php       Shared init (config, PDO, error→JSON)
│   ├── _lib/               db, auth, hash, response, trails, users, sessions, files
│   ├── auth/               register / login / logout / me
│   ├── roles/              index (list) + email (set/delete)
│   ├── trails/             index (list) + id (get/put/delete)
│   └── upload.php          multipart file upload
├── migrations/
│   └── 001_init.sql        MariaDB schema (trails, users, sessions)
├── private/
│   ├── config.php.example  Template — copy to config.php (gitignored)
│   └── config.php          DB creds, ADMIN_BOOTSTRAP_EMAIL (NEVER commit)
├── scripts/
│   ├── deploy.sh           Build + SFTP mirror to Websupport
│   └── export-kv-to-sql.mjs  One-time Upstash→MariaDB migration (legacy)
├── src/                    Vue SPA source
├── .htaccess               API routing + SPA fallback
├── .user.ini               PHP upload limits (26M to honor 25 MB cap)
└── vercel.json             (removed)
```

## Local development (frontend only)

```bash
npm install
npm run dev      # http://localhost:3000
```

The SPA expects `/api/*` to resolve same-origin. For full local dev with a backend, run PHP locally (e.g. `php -S localhost:3000 -t .` after a build), or just develop against the live Websupport API.

## Production build & deploy

```bash
npm run build    # outputs dist/
./scripts/deploy.sh
```

`deploy.sh` requires `.deploy.env` (gitignored) with:

```bash
DEPLOY_HOST=aktivity.ceaeurope.sk
DEPLOY_USER=username
DEPLOY_PASS=your-password
DEPLOY_REMOTE_DIR=/public_html
```

It mirrors `dist/`, `api/`, `.htaccess`, `.user.ini`, and (if present) `private/config.php` to the remote docroot. `tracks/` is runtime data and is left untouched on the server.

## First-time server setup (Websupport)

1. **Create a MariaDB database** in Webadmin → MySQL/MariaDB. Note the DB name, user, and password.
2. **Run the schema**: open phpMyAdmin → SQL tab → paste `migrations/001_init.sql`.
3. **Configure secrets**: copy `private/config.php.example` → `private/config.php` and fill in `DB_*` + `ADMIN_BOOTSTRAP_EMAIL`.
4. **Make `tracks/` writable**: `mkdir tracks && chmod 775 tracks` in the docroot (PHP user needs write access for uploads).
5. **Deploy** (see above).
6. **Smoke-test**:
   ```bash
   curl -s https://aktivity.ceaeurope.sk/api/auth/me   # {"error":"Neprihlásený"}
   curl -s https://aktivity.ceaeurope.sk/api/trails      # JSON array
   ```

## One-time data migration (from Upstash Redis / Vercel Blob)

Only needed once, to carry over data from the previous Vercel deployment:

```bash
node --env-file=.env.local scripts/export-kv-to-sql.mjs
```

Produces `migrate.sql` (import via phpMyAdmin) + `migration-tracks/` (SFTP to `<docroot>/tracks/`). Password hashes are preserved verbatim — users keep logging in with the same password. After import, delete `migrate.sql`, `migration-tracks/`, and the script itself.

## Roles

| Role          | Capabilities                                              |
|---------------|-----------------------------------------------------------|
| `admin`       | Manage trails + users/roles. Bootstrap admin always wins. |
| `trails_adder`| Create / edit / delete trails, see drafts.                |
| `user`        | Read published trails only.                               |

The bootstrap admin (`ADMIN_BOOTSTRAP_EMAIL` in `private/config.php`) is always `admin` regardless of the `users` table, and cannot be demoted.

## API surface

| Method | Route                       | Auth                  | Purpose                         |
|--------|-----------------------------|-----------------------|---------------------------------|
| POST   | `/api/auth/register`        | open                  | Self-register + auto-login      |
| POST   | `/api/auth/login`           | open                  | Login                           |
| POST   | `/api/auth/logout`          | any                   | Logout (idempotent)             |
| GET    | `/api/auth/me`              | any                   | Current user profile            |
| GET    | `/api/roles`                | admin                 | List users + roles              |
| PUT    | `/api/roles/<email>`        | admin                 | Set role                        |
| DELETE | `/api/roles/<email>`        | admin                 | Demote to `user`                |
| GET    | `/api/trails`               | any (drafts: manager) | List trails                     |
| GET    | `/api/trails/<id>`          | any                   | Fetch one trail                 |
| PUT    | `/api/trails/<id>`          | admin/trails_adder    | Create or update                |
| DELETE | `/api/trails/<id>`          | admin/trails_adder    | Delete trail + its files        |
| POST   | `/api/upload`               | admin/trails_adder    | Multipart upload (≤25 MB)       |

## Notes

- Cookie `dw_session` (HttpOnly, SameSite=Lax, Secure in prod, 7-day TTL) — same-origin, so the SPA's `credentials: 'include'` works with no CORS config.
- The trail id is also the storage folder name under `tracks/`. The slug rules in `api/_lib/trails.php` (`slugify`) and `api/_lib/files.php` (`storage_trail_id`) MUST stay in sync with `getStorageTrailId()` in `src/data/customTrails.js`.
- Sessions are swept opportunistically (~1% of writes) — no cron needed at this scale.
- Websupport's nightly DB + filesystem backups cover disaster recovery.

## License

MIT.
