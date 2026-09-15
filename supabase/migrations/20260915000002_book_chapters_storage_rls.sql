-- ============================================================
-- Phase 21: Book Chapters Storage RLS Hardening (SEC-01)
-- ============================================================

-- 1. Ensure storage.objects DELETE policy for book-chapters bucket
-- Authenticated author can delete only their own chapter bundle (${book.slug}.json)
drop policy if exists "Authors can delete their own chapter bundles" on storage.objects;
create policy "Authors can delete their own chapter bundles"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'book-chapters'
    and (
      exists (
        select 1 from public.books b
        where (b.slug || '.json') = storage.objects.name
          and b.user_id = (select auth.uid())
      )
      or public.is_admin((select auth.uid()))
    )
  );

-- 2. Authors can upload/insert chapter bundles for their own books
drop policy if exists "Authors can upload their own chapter bundles" on storage.objects;
create policy "Authors can upload their own chapter bundles"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'book-chapters'
    and (
      exists (
        select 1 from public.books b
        where (b.slug || '.json') = storage.objects.name
          and b.user_id = (select auth.uid())
      )
      or public.is_admin((select auth.uid()))
    )
  );

-- 3. Authors can update chapter bundles for their own books
drop policy if exists "Authors can update their own chapter bundles" on storage.objects;
create policy "Authors can update their own chapter bundles"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'book-chapters'
    and (
      exists (
        select 1 from public.books b
        where (b.slug || '.json') = storage.objects.name
          and b.user_id = (select auth.uid())
      )
      or public.is_admin((select auth.uid()))
    )
  )
  with check (
    bucket_id = 'book-chapters'
    and (
      exists (
        select 1 from public.books b
        where (b.slug || '.json') = storage.objects.name
          and b.user_id = (select auth.uid())
      )
      or public.is_admin((select auth.uid()))
    )
  );
