-- =============================================================================
-- Migration: Seed initial admin user
--
-- This row is REQUIRED for is_admin() / is_trail_manager() to return true for
-- the bootstrap admin. Without it, NO ONE can write to trails or user_roles
-- (bootstrap deadlock — the RLS functions check this table).
--
-- Email must match VITE_ADMIN_EMAILS in .env.local / .env.prod.
-- To change the admin after first deploy: update this value and run db reset.
-- =============================================================================

insert into public.user_roles (email, role)
values ('deletezajac@gmail.com', 'admin')
on conflict (email) do update set role = 'admin';
