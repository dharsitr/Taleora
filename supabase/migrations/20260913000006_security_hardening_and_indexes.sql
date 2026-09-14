-- ============================================================
-- Phase 13: Security Hardening & Performance Optimization
-- ============================================================

-- 1. Revoke Public / Anonymous RPC Execution on Internal & Trigger Functions
revoke execute on function public.handle_author_follower_sync() from public, anon, authenticated;
revoke execute on function public.handle_review_comment_sync() from public, anon, authenticated;
revoke execute on function public.handle_review_like_sync() from public, anon, authenticated;
revoke execute on function public.handle_review_rating_sync() from public, anon, authenticated;
revoke execute on function public.protect_profile_roles() from public, anon, authenticated;

-- Publish scheduled chapters should only be executed by service_role (e.g. pg_cron or API route with service key)
revoke execute on function public.publish_scheduled_chapters() from public, anon, authenticated;
grant execute on function public.publish_scheduled_chapters() to service_role;

-- Restrict helper functions from public/anon
revoke execute on function public.is_admin(uuid) from public, anon;
grant execute on function public.is_admin(uuid) to authenticated, service_role;

revoke execute on function public.is_admin_or_moderator(uuid) from public, anon;
grant execute on function public.is_admin_or_moderator(uuid) to authenticated, service_role;

revoke execute on function public.reorder_chapters(uuid, uuid[]) from public, anon;
grant execute on function public.reorder_chapters(uuid, uuid[]) to authenticated, service_role;

-- 2. Add Covering Indexes for Unindexed Foreign Keys
create index if not exists idx_authors_moderated_by on public.authors(moderated_by);
create index if not exists idx_book_reviews_moderated_by on public.book_reviews(moderated_by);
create index if not exists idx_books_moderated_by on public.books(moderated_by);
create index if not exists idx_chapters_moderated_by on public.chapters(moderated_by);
create index if not exists idx_comments_moderated_by on public.comments(moderated_by);
create index if not exists idx_comments_user_id on public.comments(user_id);
create index if not exists idx_notifications_actor_id on public.notifications(actor_id);
create index if not exists idx_profiles_suspended_by on public.profiles(suspended_by);
create index if not exists idx_reports_resolved_by on public.reports(resolved_by);

-- 3. Consolidate Multiple Permissive Policies for Performance & Simplicity
-- Authors UPDATE
drop policy if exists "Admins and moderators can update any author" on public.authors;
drop policy if exists "Authors can update their own author profile" on public.authors;
create policy "Authors and moderators can update authors"
  on public.authors for update
  to authenticated
  using (((select auth.uid()) = user_id) or public.is_admin_or_moderator((select auth.uid())));

-- Book Reviews UPDATE
drop policy if exists "Admins and moderators can update any review" on public.book_reviews;
drop policy if exists "Users can update their own review" on public.book_reviews;
create policy "Authors and moderators can update reviews"
  on public.book_reviews for update
  to authenticated
  using (((select auth.uid()) = user_id) or public.is_admin_or_moderator((select auth.uid())));

-- Books UPDATE
drop policy if exists "Admins and moderators can update any book" on public.books;
drop policy if exists "Authors can update their own books" on public.books;
create policy "Authors and moderators can update books"
  on public.books for update
  to authenticated
  using (((select auth.uid()) = user_id) or public.is_admin_or_moderator((select auth.uid())));

-- Chapters UPDATE
drop policy if exists "Admins and moderators can update any chapter" on public.chapters;
drop policy if exists "Authors can update their own chapters" on public.chapters;
create policy "Authors and moderators can update chapters"
  on public.chapters for update
  to authenticated
  using (((select auth.uid()) = user_id) or public.is_admin_or_moderator((select auth.uid())));

-- Comments UPDATE
drop policy if exists "Admins and moderators can update any comment" on public.comments;
drop policy if exists "Users can update their own comment" on public.comments;
create policy "Authors and moderators can update comments"
  on public.comments for update
  to authenticated
  using (((select auth.uid()) = user_id) or public.is_admin_or_moderator((select auth.uid())));

-- Profiles UPDATE
drop policy if exists "Admins can update any profile" on public.profiles;
drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users and admins can update profiles"
  on public.profiles for update
  to authenticated
  using (((select auth.uid()) = id) or public.is_admin((select auth.uid())));

-- Reports SELECT
drop policy if exists "Admins and moderators can view all reports" on public.reports;
drop policy if exists "Users can view their own submitted reports" on public.reports;
create policy "Users and moderators can view reports"
  on public.reports for select
  to authenticated
  using (((select auth.uid()) = reporter_id) or public.is_admin_or_moderator((select auth.uid())));

-- 4. Storage Policy Hardening: Allow admins & moderators to remove violating covers
drop policy if exists "Admins and moderators can delete uploaded covers" on storage.objects;
create policy "Admins and moderators can delete uploaded covers"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'book-covers' and (
      (storage.foldername(name))[1] = ((select auth.uid())::text) or
      public.is_admin_or_moderator((select auth.uid()))
    )
  );
