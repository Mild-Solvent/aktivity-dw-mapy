# Contributor Deploy Guide — aktivity-dw-mapy

> **For agents**: Read this entire file before doing anything. It contains the full context, the exact commands, and the verification checklist to finish deploying to the live Supabase instance.

---

## Context

This is a **Vue 3 + Vite SPA** deployed on GitHub Pages.  
All data (trails, user roles, file storage) lives in **Supabase** (cloud + local Docker for dev).

A full overhaul was completed on the local Docker instance and is **verified working**.  
The outstanding task is to **push the new migrations to the live Supabase project** and verify them.

---

## What Was Changed (already done, do not redo)

### New migrations in `supabase/migrations/`:

| File | What it does |
|---|---|
| `20260615000100_fix_rls_with_role_functions.sql` | Creates `get_my_role()`, `is_trail_manager()`, `is_admin()` Postgres helper functions. Replaces all previous permissive "any authenticated user" write policies with role-checked ones. Seeds the bootstrap admin. |
| `20260615000200_add_storage_delete_policies.sql` | Adds DELETE policies to `trail-photos` and `trail-files` storage buckets for trail managers. |
| `20260615000300_add_trail_status.sql` | Adds `status` column (`published`/`draft`) to the `trails` table. Updates SELECT policies so anonymous users only see published trails; trail managers see all. |

### Frontend fixes already applied:
- `src/config/admin.js` — admin email now reads from `VITE_ADMIN_EMAILS` env var (not hardcoded)
- `src/data/customTrails.js` — upsert now writes `status` to the dedicated DB column
- `src/data/roles.js` — added `deleteRemoteRole()` function
- `src/components/TrackDetail.vue` — fixed sport title/icon for hiking and running (was showing "MTB Cyklistika" for all)
- `src/components/AdminAddTrail.vue` — fixed GPX skip bug + added Published/Draft toggle
- `src/components/AdminRoles.vue` — added "Odobrať" (remove) button per user
- `src/components/AdminManageTrails.vue` — added status badge + inline delete button

---

## Your Task: Push Migrations to Live

### Prerequisites
- You have the **Supabase service role key** (secret key) for the live project
- The live project ref is: `kjrbmbvjdwvompbjjtmf`
- You have `bunx` available (or `npx`)

### Step 1 — Link to the live project

```powershell
bunx supabase link --project-ref kjrbmbvjdwvompbjjtmf
```

When prompted for the database password, use the **Postgres DB password** from the Supabase dashboard (Settings → Database → Database password). If not prompted, the link will use the stored credentials.

### Step 2 — Check current migration state on live

```powershell
bunx supabase migration list --linked
```

You should see the old migrations already applied. The 3 new ones (`20260615*`) should show as **not applied**.

### Step 3 — Push the new migrations

```powershell
bunx supabase db push
```

This applies only the missing migrations (the 3 new `20260615*` files) without touching existing data.

> ⚠️ **Do NOT run `bunx supabase db reset --linked`** — that wipes all live data. Use `db push` only.

### Step 4 — Seed the admin email on live

The migration `20260615000100` seeds `deletezajac@gmail.com` as admin.  
If you need to add a different or additional admin, run this SQL in the **Supabase Dashboard → SQL Editor** on the live project:

```sql
INSERT INTO public.user_roles (email, role)
VALUES ('your-admin@example.com', 'admin')
ON CONFLICT (email) DO UPDATE SET role = 'admin';
```

---

## Verification After Push

Open the **live Supabase Studio** → SQL Editor and run:

```sql
-- 1. Confirm the 3 new helper functions exist
SELECT proname FROM pg_proc
WHERE proname IN ('get_my_role', 'is_trail_manager', 'is_admin');
-- Expected: 3 rows

-- 2. Confirm status column exists on trails
SELECT column_name, column_default
FROM information_schema.columns
WHERE table_name = 'trails' AND column_name = 'status';
-- Expected: 1 row, default = 'published'

-- 3. Confirm admin is seeded
SELECT email, role FROM public.user_roles WHERE role = 'admin';
-- Expected: at least deletezajac@gmail.com

-- 4. Confirm new RLS policies
SELECT policyname, cmd FROM pg_policies
WHERE tablename = 'trails'
ORDER BY policyname;
-- Should NOT contain any "Authenticated users can..." policies
-- Should contain "Trail managers can..." policies
```

---

## Environment Variables for GitHub Pages Deploy

The live GitHub Pages deploy needs these secrets set in **GitHub → Settings → Secrets → Actions**:

| Secret name | Value |
|---|---|
| `VITE_SUPABASE_URL` | `https://kjrbmbvjdwvompbjjtmf.supabase.co` |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | The `sb_publishable_...` key from Supabase Dashboard → Settings → API |
| `VITE_ADMIN_EMAILS` | `deletezajac@gmail.com` (comma-separated if multiple) |

Check `vite.config.js` and `.github/` workflows to see how these are injected at build time.

---

## Local Dev (for reference)

If you want to run locally against Docker instead of live:

```powershell
# Start local Supabase
bunx supabase start

# Copy the "Publishable" key from the output into .env.local:
# VITE_SUPABASE_URL=http://127.0.0.1:55321
# VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
# VITE_ADMIN_EMAILS=deletezajac@gmail.com

# Apply all migrations fresh
bunx supabase db reset

# Start the app
bun run dev   # → http://localhost:3000

# Clear browser localStorage to start from blank slate:
# F12 → Console → localStorage.clear(); location.reload()
```

---

## Architecture Quick Reference

```
Supabase (cloud)
  ├── trails table          — id (text PK), payload (JSONB), status (text), created_by, timestamps
  ├── user_roles table      — email (PK), role ('admin' | 'trails_adder' | 'user')
  ├── trail-photos bucket   — preview images (public)
  └── trail-files bucket    — GPX files (public)

Vue app (GitHub Pages, static)
  ├── src/lib/supabase.js   — Supabase client (reads VITE_ env vars)
  ├── src/config/admin.js   — role constants + VITE_ADMIN_EMAILS parser
  ├── src/data/
  │   ├── customTrails.js   — all trail CRUD (Supabase + localStorage fallback)
  │   └── roles.js          — user role CRUD
  └── src/components/
      ├── AdminAddTrail.vue      — create/edit trail form (admin + trails_adder only)
      ├── AdminManageTrails.vue  — list + delete trails
      ├── AdminRoles.vue         — assign/remove user roles (admin only)
      └── AdminTrailDrafts.vue   — localStorage draft browser
```

### Role hierarchy
| Role | Can view trails | Can add/edit/delete trails | Can manage roles |
|---|---|---|---|
| Anonymous | Published only | ❌ | ❌ |
| `user` | Published only | ❌ | ❌ |
| `trails_adder` | All (incl. drafts) | ✅ | ❌ |
| `admin` | All (incl. drafts) | ✅ | ✅ |

> Role checks happen at **both** the Postgres RLS level (enforced by DB) and the Vue frontend (UI guards). The DB is the source of truth.
