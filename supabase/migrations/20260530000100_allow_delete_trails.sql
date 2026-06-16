-- Drop any prior version of this policy (permissive or role-gated)
drop policy if exists "Authenticated users can delete trails" on public.trails;
drop policy if exists "Trail managers can delete trails" on public.trails;

-- Role-gated delete: only admin or trails_adder may delete.
-- Note: public.is_trail_manager() does not exist yet at this migration step,
-- so we inline the check as a subquery to avoid a dependency on migration order.
create policy "Trail managers can delete trails"
on public.trails
for delete
to authenticated
using (
  exists (
    select 1 from public.user_roles
    where email = auth.email()
      and role in ('admin', 'trails_adder')
  )
);
