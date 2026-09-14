-- ============================================================
-- Phase 18: Optimize and Decouple Authors, Books, and Chapters UPDATE RLS
-- ============================================================

-- 1. Authors UPDATE: Separate author self-update from admin/moderator update
drop policy if exists "Authors and moderators can update authors" on public.authors;
drop policy if exists "Authors can update their own author profile" on public.authors;
drop policy if exists "Admins and moderators can update any author" on public.authors;

create policy "Authors can update their own author profile"
  on public.authors for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Admins and moderators can update any author"
  on public.authors for update
  to authenticated
  using (public.is_admin_or_moderator((select auth.uid())))
  with check (public.is_admin_or_moderator((select auth.uid())));

-- 2. Books UPDATE: Separate author self-update from admin/moderator update
drop policy if exists "Authors and moderators can update books" on public.books;
drop policy if exists "Authors can update their own books" on public.books;
drop policy if exists "Admins and moderators can update any book" on public.books;

create policy "Authors can update their own books"
  on public.books for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Admins and moderators can update any book"
  on public.books for update
  to authenticated
  using (public.is_admin_or_moderator((select auth.uid())))
  with check (public.is_admin_or_moderator((select auth.uid())));

-- 3. Chapters UPDATE: Separate author self-update from admin/moderator update
drop policy if exists "Authors and moderators can update chapters" on public.chapters;
drop policy if exists "Authors can update their own chapters" on public.chapters;
drop policy if exists "Admins and moderators can update any chapter" on public.chapters;

create policy "Authors can update their own chapters"
  on public.chapters for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Admins and moderators can update any chapter"
  on public.chapters for update
  to authenticated
  using (public.is_admin_or_moderator((select auth.uid())))
  with check (public.is_admin_or_moderator((select auth.uid())));
