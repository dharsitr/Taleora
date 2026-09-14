-- ============================================================
-- Phase 17: Fix Chapters, Reviews, and Comments RLS Policies
-- ============================================================

-- 1. Restore execute privilege on helper functions for authenticated role
grant execute on function public.is_admin(uuid) to authenticated;
grant execute on function public.is_admin_or_moderator(uuid) to authenticated;

-- 2. Split Chapters SELECT for anon and authenticated
drop policy if exists "Chapters are viewable if published or author owned" on public.chapters;
drop policy if exists "Anon can view published chapters" on public.chapters;
drop policy if exists "Authenticated can view chapters" on public.chapters;

create policy "Anon can view published chapters"
  on public.chapters for select
  to anon
  using (
    status = 'published'
    and (published_at is null or published_at <= now())
    and is_suspended = false
  );

create policy "Authenticated can view chapters"
  on public.chapters for select
  to authenticated
  using (
    (status = 'published' and (published_at is null or published_at <= now()) and is_suspended = false)
    or ((select auth.uid()) = user_id)
    or public.is_admin_or_moderator((select auth.uid()))
  );

-- 3. Split Book Reviews SELECT for anon and authenticated
drop policy if exists "Reviews are viewable by everyone" on public.book_reviews;
drop policy if exists "Anon can view approved reviews" on public.book_reviews;
drop policy if exists "Authenticated can view reviews" on public.book_reviews;

create policy "Anon can view approved reviews"
  on public.book_reviews for select
  to anon
  using (moderation_status in ('approved', 'flagged'));

create policy "Authenticated can view reviews"
  on public.book_reviews for select
  to authenticated
  using (
    moderation_status in ('approved', 'flagged')
    or ((select auth.uid()) = user_id)
    or public.is_admin_or_moderator((select auth.uid()))
  );

-- 4. Split Comments SELECT for anon and authenticated
drop policy if exists "Comments are viewable by everyone" on public.comments;
drop policy if exists "Anon can view approved comments" on public.comments;
drop policy if exists "Authenticated can view comments" on public.comments;

create policy "Anon can view approved comments"
  on public.comments for select
  to anon
  using (moderation_status in ('approved', 'flagged'));

create policy "Authenticated can view comments"
  on public.comments for select
  to authenticated
  using (
    moderation_status in ('approved', 'flagged')
    or ((select auth.uid()) = user_id)
    or public.is_admin_or_moderator((select auth.uid()))
  );
