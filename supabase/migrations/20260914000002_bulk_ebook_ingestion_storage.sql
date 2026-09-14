-- ============================================================
-- Phase 16: Bulk Ebook Ingestion & Storage Architecture
-- ============================================================

-- 1. Add file_path and file_url columns to books table
alter table public.books 
  add column if not exists file_path text,
  add column if not exists file_url text;

create index if not exists idx_books_file_path on public.books(file_path);

-- 2. Storage: Ensure ebook-files bucket exists and is public
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'ebook-files',
  'ebook-files',
  true,
  52428800,
  array['application/epub+zip', 'application/pdf', 'application/octet-stream', 'application/zip']
)
on conflict (id) do update set 
  public = true,
  file_size_limit = 52428800;

-- 3. Storage RLS: Public read policy for ebook-files
drop policy if exists "Ebook files are viewable by everyone" on storage.objects;
create policy "Ebook files are viewable by everyone"
  on storage.objects for select
  using (bucket_id = 'ebook-files');
