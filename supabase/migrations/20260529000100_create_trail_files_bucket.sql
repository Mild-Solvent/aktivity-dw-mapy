insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'trail-files',
  'trail-files',
  true,
  52428800,
  array['application/gpx+xml', 'application/xml', 'text/xml', 'application/octet-stream']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Anyone can read trail files" on storage.objects;
create policy "Anyone can read trail files"
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'trail-files');

drop policy if exists "Authenticated users can upload trail files" on storage.objects;
create policy "Authenticated users can upload trail files"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'trail-files');

drop policy if exists "Authenticated users can update trail files" on storage.objects;
create policy "Authenticated users can update trail files"
on storage.objects
for update
to authenticated
using (bucket_id = 'trail-files')
with check (bucket_id = 'trail-files');
