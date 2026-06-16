-- =============================================================================
-- Migration: Grant table privileges to client roles
--
-- Postgres requires SQL-level table privileges (SELECT, INSERT, UPDATE, DELETE)
-- before checking Row-Level Security (RLS). Without these grants, queries from the
-- PostgREST API (acting as anon/authenticated) fail with permission denied.
-- =============================================================================

-- Grant select to anonymous users on trails (they only need read access to published trails, no write access, and no access to user_roles)
grant select on table public.trails to anon;

-- Grant full access to authenticated users (RLS will restrict writes to trail managers/admins only)
grant select, insert, update, delete on table public.trails to authenticated;
grant select, insert, update, delete on table public.user_roles to authenticated;

-- Grant full access to service_role (which bypasses RLS for admin/backend scripts)
grant select, insert, update, delete on table public.trails to service_role;
grant select, insert, update, delete on table public.user_roles to service_role;
