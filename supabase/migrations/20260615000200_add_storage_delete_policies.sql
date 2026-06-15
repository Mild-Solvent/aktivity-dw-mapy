-- =============================================================================
-- Migration: Add DELETE policies to storage buckets
-- Allows trail managers (admin + trails_adder) to delete their uploaded files.
-- =============================================================================

-- trail-photos: DELETE for trail managers
drop policy if exists "Trail managers can delete trail photos" on storage.objects;
create policy "Trail managers can delete trail photos"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'trail-photos'
  and public.is_trail_manager()
);

-- trail-files: DELETE for trail managers
drop policy if exists "Trail managers can delete trail files" on storage.objects;
create policy "Trail managers can delete trail files"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'trail-files'
  and public.is_trail_manager()
);
