insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'trail-photos',
  'trail-photos',
  true,
  52428800,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Anyone can read trail photos" on storage.objects;
create policy "Anyone can read trail photos"
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'trail-photos');

drop policy if exists "Authenticated users can upload trail photos" on storage.objects;
create policy "Authenticated users can upload trail photos"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'trail-photos');

drop policy if exists "Authenticated users can update trail photos" on storage.objects;
create policy "Authenticated users can update trail photos"
on storage.objects
for update
to authenticated
using (bucket_id = 'trail-photos')
with check (bucket_id = 'trail-photos');
