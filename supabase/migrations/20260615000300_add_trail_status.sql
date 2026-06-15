-- =============================================================================
-- Migration: Add published/draft status to trails
--
-- The status column serves two purposes:
--   1. DB-level RLS filtering — anon/regular users only see 'published' rows.
--   2. UI display — the frontend reads status from payload.status (also stored
--      there by saveRemoteAdminTrail so both stay in sync).
-- =============================================================================

-- Add status column (default 'published' so existing rows are immediately live)
alter table public.trails
add column if not exists status text not null default 'published'
check (status in ('published', 'draft'));

-- ---------------------------------------------------------------------------
-- Update SELECT policies:
--   - Drop the old blanket "anyone can read trails"
--   - Anon + authenticated non-managers: only published rows
--   - Trail managers (admin / trails_adder): all rows (including drafts)
-- ---------------------------------------------------------------------------

drop policy if exists "Anyone can read trails" on public.trails;

-- Public-facing: only published trails
create policy "Anyone can read published trails"
on public.trails
for select
to anon, authenticated
using (status = 'published');

-- Trail managers can also read their own drafts
-- (multiple SELECT policies are OR'd, so managers see union of both)
create policy "Trail managers can read all trails"
on public.trails
for select
to authenticated
using (public.is_trail_manager());
