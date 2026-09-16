-- ============================================================
-- Phase 21: Secure Admin RPC & Consolidate Permissive UPDATE RLS
-- Addresses findings SEC-03 and PERF-02
-- ============================================================

-- ------------------------------------------------------------
-- 1. SEC-03: Revoke execution on is_admin and is_admin_or_moderator
--    Revoke execute from PUBLIC, anon, and authenticated so that
--    signed-in users cannot enumerate admin accounts via PostgREST RPC.
--    Grant execute strictly to server/database internal roles.
-- ------------------------------------------------------------
revoke execute on function public.is_admin(uuid) from public;
revoke execute on function public.is_admin(uuid) from anon;
revoke execute on function public.is_admin(uuid) from authenticated;
grant execute on function public.is_admin(uuid) to postgres, service_role;

revoke execute on function public.is_admin_or_moderator(uuid) from public;
revoke execute on function public.is_admin_or_moderator(uuid) from anon;
revoke execute on function public.is_admin_or_moderator(uuid) from authenticated;
grant execute on function public.is_admin_or_moderator(uuid) to postgres, service_role;

-- ------------------------------------------------------------
-- 2. PERF-02: Consolidate duplicate permissive UPDATE RLS policies
--    Combines separate author self-update and admin/moderator update
--    into a single unified UPDATE policy for books, authors, and chapters.
-- ------------------------------------------------------------

-- Authors UPDATE
drop policy if exists "Admins and moderators can update any author" on public.authors;
drop policy if exists "Authors can update their own author profile" on public.authors;
drop policy if exists "Authors and moderators can update authors" on public.authors;

create policy "Authors and moderators can update authors"
  on public.authors for update
  to authenticated
  using (
    (select auth.uid()) = user_id
    or exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid())
        and p.role in ('admin', 'moderator')
        and p.is_suspended = false
    )
  )
  with check (
    (select auth.uid()) = user_id
    or exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid())
        and p.role in ('admin', 'moderator')
        and p.is_suspended = false
    )
  );

-- Books UPDATE
drop policy if exists "Admins and moderators can update any book" on public.books;
drop policy if exists "Authors can update their own books" on public.books;
drop policy if exists "Authors and moderators can update books" on public.books;

create policy "Authors and moderators can update books"
  on public.books for update
  to authenticated
  using (
    (select auth.uid()) = user_id
    or exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid())
        and p.role in ('admin', 'moderator')
        and p.is_suspended = false
    )
  )
  with check (
    (select auth.uid()) = user_id
    or exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid())
        and p.role in ('admin', 'moderator')
        and p.is_suspended = false
    )
  );

-- Chapters UPDATE
drop policy if exists "Admins and moderators can update any chapter" on public.chapters;
drop policy if exists "Authors can update their own chapters" on public.chapters;
drop policy if exists "Authors and moderators can update chapters" on public.chapters;

create policy "Authors and moderators can update chapters"
  on public.chapters for update
  to authenticated
  using (
    (select auth.uid()) = user_id
    or exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid())
        and p.role in ('admin', 'moderator')
        and p.is_suspended = false
    )
  )
  with check (
    (select auth.uid()) = user_id
    or exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid())
        and p.role in ('admin', 'moderator')
        and p.is_suspended = false
    )
  );

-- ------------------------------------------------------------
-- 3. Update remaining RLS policies to use inline subquery
--    Ensures authenticated role performs authorization checks via indexed
--    profile queries directly, without requiring execute on RPC functions.
-- ------------------------------------------------------------

-- Books SELECT
drop policy if exists "Authenticated can view books" on public.books;
create policy "Authenticated can view books"
  on public.books for select
  to authenticated
  using (
    (status = 'published' and is_suspended = false)
    or ((select auth.uid()) = user_id)
    or exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid())
        and p.role in ('admin', 'moderator')
        and p.is_suspended = false
    )
  );

-- Books DELETE
drop policy if exists "Authors can delete their own books" on public.books;
create policy "Authors can delete their own books"
  on public.books for delete
  to authenticated
  using (
    ((select auth.uid()) = user_id)
    or exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid())
        and p.role = 'admin'
        and p.is_suspended = false
    )
  );

-- Chapters SELECT
drop policy if exists "Authenticated can view chapters" on public.chapters;
create policy "Authenticated can view chapters"
  on public.chapters for select
  to authenticated
  using (
    (status = 'published' and (published_at is null or published_at <= now()) and is_suspended = false)
    or ((select auth.uid()) = user_id)
    or exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid())
        and p.role in ('admin', 'moderator')
        and p.is_suspended = false
    )
  );

-- Chapters DELETE
drop policy if exists "Authors can delete their own chapters" on public.chapters;
create policy "Authors can delete their own chapters"
  on public.chapters for delete
  to authenticated
  using (
    ((select auth.uid()) = user_id)
    or exists (
      select 1 from public.books b
      where b.id = chapters.book_id
        and b.user_id = (select auth.uid())
    )
    or exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid())
        and p.role = 'admin'
        and p.is_suspended = false
    )
  );

-- Book Reviews SELECT & UPDATE
drop policy if exists "Authenticated can view reviews" on public.book_reviews;
create policy "Authenticated can view reviews"
  on public.book_reviews for select
  to authenticated
  using (
    moderation_status in ('approved', 'flagged')
    or ((select auth.uid()) = user_id)
    or exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid())
        and p.role in ('admin', 'moderator')
        and p.is_suspended = false
    )
  );

drop policy if exists "Authors and moderators can update reviews" on public.book_reviews;
create policy "Authors and moderators can update reviews"
  on public.book_reviews for update
  to authenticated
  using (
    ((select auth.uid()) = user_id)
    or exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid())
        and p.role in ('admin', 'moderator')
        and p.is_suspended = false
    )
  );

-- Comments SELECT & UPDATE
drop policy if exists "Authenticated can view comments" on public.comments;
create policy "Authenticated can view comments"
  on public.comments for select
  to authenticated
  using (
    moderation_status in ('approved', 'flagged')
    or ((select auth.uid()) = user_id)
    or exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid())
        and p.role in ('admin', 'moderator')
        and p.is_suspended = false
    )
  );

drop policy if exists "Authors and moderators can update comments" on public.comments;
create policy "Authors and moderators can update comments"
  on public.comments for update
  to authenticated
  using (
    ((select auth.uid()) = user_id)
    or exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid())
        and p.role in ('admin', 'moderator')
        and p.is_suspended = false
    )
  );

-- Profiles UPDATE
drop policy if exists "Users and admins can update profiles" on public.profiles;
create policy "Users and admins can update profiles"
  on public.profiles for update
  to authenticated
  using (
    ((select auth.uid()) = id)
    or exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid())
        and p.role = 'admin'
        and p.is_suspended = false
    )
  );

-- Reports SELECT & UPDATE
drop policy if exists "Users and moderators can view reports" on public.reports;
create policy "Users and moderators can view reports"
  on public.reports for select
  to authenticated
  using (
    ((select auth.uid()) = reporter_id)
    or exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid())
        and p.role in ('admin', 'moderator')
        and p.is_suspended = false
    )
  );

drop policy if exists "Admins and moderators can update reports" on public.reports;
create policy "Admins and moderators can update reports"
  on public.reports for update
  to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid())
        and p.role in ('admin', 'moderator')
        and p.is_suspended = false
    )
  )
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid())
        and p.role in ('admin', 'moderator')
        and p.is_suspended = false
    )
  );

-- Admin Audit Logs SELECT & INSERT
drop policy if exists "Admins and moderators can view audit logs" on public.admin_audit_logs;
create policy "Admins and moderators can view audit logs"
  on public.admin_audit_logs for select
  to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid())
        and p.role in ('admin', 'moderator')
        and p.is_suspended = false
    )
  );

drop policy if exists "Admins and moderators can insert audit logs" on public.admin_audit_logs;
create policy "Admins and moderators can insert audit logs"
  on public.admin_audit_logs for insert
  to authenticated
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid())
        and p.role in ('admin', 'moderator')
        and p.is_suspended = false
    )
  );

-- Storage Objects (book-covers and book-chapters)
drop policy if exists "Admins and moderators can delete uploaded covers" on storage.objects;
create policy "Admins and moderators can delete uploaded covers"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'book-covers'
    and (
      (storage.foldername(name))[1] = (select auth.uid())::text
      or exists (
        select 1 from public.profiles p
        where p.id = (select auth.uid())
          and p.role in ('admin', 'moderator')
          and p.is_suspended = false
      )
    )
  );

drop policy if exists "Authors can delete their own uploaded covers" on storage.objects;
create policy "Authors can delete their own uploaded covers"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'book-covers'
    and (
      (storage.foldername(name))[1] = (select auth.uid())::text
      or exists (
        select 1 from public.profiles p
        where p.id = (select auth.uid())
          and p.role = 'admin'
          and p.is_suspended = false
      )
    )
  );

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
      or exists (
        select 1 from public.profiles p
        where p.id = (select auth.uid())
          and p.role = 'admin'
          and p.is_suspended = false
      )
    )
  );

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
      or exists (
        select 1 from public.profiles p
        where p.id = (select auth.uid())
          and p.role = 'admin'
          and p.is_suspended = false
      )
    )
  );

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
      or exists (
        select 1 from public.profiles p
        where p.id = (select auth.uid())
          and p.role = 'admin'
          and p.is_suspended = false
      )
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
      or exists (
        select 1 from public.profiles p
        where p.id = (select auth.uid())
          and p.role = 'admin'
          and p.is_suspended = false
      )
    )
  );
