-- =============================================================================
-- Migration: Secure RLS with role-checking Postgres functions
-- Replaces the previous "any authenticated user can write" policies with
-- proper role-based guards via helper functions that query user_roles.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Helper functions (SECURITY DEFINER so they bypass RLS when reading roles)
-- ---------------------------------------------------------------------------

create or replace function public.get_my_role()
returns text
language sql
security definer
stable
set search_path = public
as $$
  select role from public.user_roles where email = auth.email()
$$;

create or replace function public.is_trail_manager()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select coalesce(
    (select role in ('admin', 'trails_adder')
     from public.user_roles
     where email = auth.email()),
    false
  )
$$;

create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select coalesce(
    (select role = 'admin'
     from public.user_roles
     where email = auth.email()),
    false
  )
$$;

-- ---------------------------------------------------------------------------
-- TRAILS — replace permissive write policies
-- ---------------------------------------------------------------------------

drop policy if exists "Authenticated users can save trails" on public.trails;
create policy "Trail managers can save trails"
on public.trails
for insert
to authenticated
with check (public.is_trail_manager());

drop policy if exists "Authenticated users can update trails" on public.trails;
create policy "Trail managers can update trails"
on public.trails
for update
to authenticated
using (public.is_trail_manager())
with check (public.is_trail_manager());

drop policy if exists "Authenticated users can delete trails" on public.trails;
drop policy if exists "Trail managers can delete trails" on public.trails;
create policy "Trail managers can delete trails"
on public.trails
for delete
to authenticated
using (public.is_trail_manager());

-- ---------------------------------------------------------------------------
-- USER_ROLES — restrict writes to admins only
-- ---------------------------------------------------------------------------

drop policy if exists "Authenticated users can save roles" on public.user_roles;
create policy "Admins can save roles"
on public.user_roles
for insert
to authenticated
with check (public.is_admin());

drop policy if exists "Authenticated users can update roles" on public.user_roles;
create policy "Admins can update roles"
on public.user_roles
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Admins can delete roles" on public.user_roles;
create policy "Admins can delete roles"
on public.user_roles
for delete
to authenticated
using (public.is_admin());

-- Seed has been moved to: 20260615000400_seed_admin.sql
