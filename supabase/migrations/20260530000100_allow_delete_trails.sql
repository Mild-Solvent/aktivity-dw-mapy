drop policy if exists "Authenticated users can delete trails" on public.trails;
create policy "Authenticated users can delete trails"
on public.trails
for delete
to authenticated
using (true);
