-- ============================================================
-- Phase 20: Secure Deletion & Cascade Hardening
-- ============================================================

-- 1. Ensure public.books DELETE RLS strictly restricts to book owner or admin
drop policy if exists "Authors can delete their own books" on public.books;
create policy "Authors can delete their own books"
  on public.books for delete
  to authenticated
  using (
    (select auth.uid()) = user_id
    or public.is_admin((select auth.uid()))
  );

-- 2. Ensure public.chapters DELETE RLS checks direct user_id,
-- parent book ownership, or admin privileges
drop policy if exists "Authors can delete their own chapters" on public.chapters;
create policy "Authors can delete their own chapters"
  on public.chapters for delete
  to authenticated
  using (
    (select auth.uid()) = user_id
    or exists (
      select 1 from public.books b
      where b.id = chapters.book_id
        and b.user_id = (select auth.uid())
    )
    or public.is_admin((select auth.uid()))
  );

-- 3. Storage objects DELETE policy hardening for book-covers
drop policy if exists "Authors can delete their own uploaded covers" on storage.objects;
create policy "Authors can delete their own uploaded covers"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'book-covers'
    and (
      (storage.foldername(name))[1] = (select auth.uid())::text
      or public.is_admin((select auth.uid()))
    )
  );
