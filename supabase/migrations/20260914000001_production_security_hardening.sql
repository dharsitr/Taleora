-- ============================================================
-- Phase 15: Production Security Hardening
-- ============================================================

-- 1. Fix Books SELECT RLS: split anon vs authenticated
--    so anon never needs to call is_admin_or_moderator()
drop policy if exists "Books are viewable if published or author owned" on public.books;
drop policy if exists "Published books are viewable by everyone" on public.books;
drop policy if exists "Anon can view published books" on public.books;
drop policy if exists "Authenticated can view books" on public.books;

create policy "Anon can view published books"
  on public.books for select
  to anon
  using (status = 'published' and is_suspended = false);

create policy "Authenticated can view books"
  on public.books for select
  to authenticated
  using (
    (status = 'published' and is_suspended = false)
    or ((select auth.uid()) = user_id)
    or public.is_admin_or_moderator((select auth.uid()))
  );

-- 2. Revoke anon grant on is_admin_or_moderator (was incorrectly added earlier)
revoke execute on function public.is_admin_or_moderator(uuid) from anon;

-- 3. Lock SECURITY DEFINER helper functions from direct REST API calls
--    (they are only needed inside RLS policies / service_role context)
revoke execute on function public.is_admin(uuid) from authenticated;
revoke execute on function public.is_admin_or_moderator(uuid) from authenticated;
grant execute on function public.is_admin(uuid) to service_role;
grant execute on function public.is_admin_or_moderator(uuid) to service_role;
-- reorder_chapters IS a legitimate app RPC call — keep it
grant execute on function public.reorder_chapters(uuid, uuid[]) to authenticated;

-- 4. Enable pg_cron and schedule publish_scheduled_chapters every 5 minutes
create extension if not exists pg_cron schema cron;

select cron.schedule(
  'publish-scheduled-chapters',
  '*/5 * * * *',
  $$select public.publish_scheduled_chapters();$$
);
