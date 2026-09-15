-- ============================================================
-- Phase 19: Book Chapters Storage Bucket for Cloud Reader
-- ============================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'book-chapters',
  'book-chapters',
  true,
  10485760,
  array['application/json', 'text/plain']
)
on conflict (id) do update set 
  public = true,
  file_size_limit = 10485760;

drop policy if exists "Book chapters are viewable by everyone" on storage.objects;
create policy "Book chapters are viewable by everyone"
  on storage.objects for select
  using (bucket_id = 'book-chapters');
