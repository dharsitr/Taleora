-- ============================================================
-- Phase 12: Admin & Moderation System Migration
-- ============================================================

-- 1. Profiles RBAC & Moderation Fields
alter table public.profiles
  add column if not exists role text not null default 'user' check (role in ('user', 'moderator', 'admin')),
  add column if not exists is_suspended boolean not null default false,
  add column if not exists suspended_at timestamptz,
  add column if not exists suspension_reason text,
  add column if not exists suspended_by uuid references auth.users(id) on delete set null;

create index if not exists idx_profiles_role on public.profiles(role);
create index if not exists idx_profiles_suspended on public.profiles(is_suspended);

-- 2. Security Definer Helper Functions
create or replace function public.is_admin_or_moderator(user_id uuid)
returns boolean
language sql
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = user_id and role in ('admin', 'moderator') and is_suspended = false
  );
$$;

create or replace function public.is_admin(user_id uuid)
returns boolean
language sql
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = user_id and role = 'admin' and is_suspended = false
  );
$$;

-- 3. Content Moderation Fields for Books, Chapters, Authors, Reviews, Comments
alter table public.books
  add column if not exists is_suspended boolean not null default false,
  add column if not exists suspension_reason text,
  add column if not exists moderated_by uuid references auth.users(id) on delete set null,
  add column if not exists moderated_at timestamptz;

create index if not exists idx_books_suspended on public.books(is_suspended);

alter table public.chapters
  add column if not exists is_suspended boolean not null default false,
  add column if not exists suspension_reason text,
  add column if not exists moderated_by uuid references auth.users(id) on delete set null,
  add column if not exists moderated_at timestamptz;

create index if not exists idx_chapters_suspended on public.chapters(is_suspended);

alter table public.authors
  add column if not exists is_verified boolean not null default false,
  add column if not exists is_suspended boolean not null default false,
  add column if not exists suspension_reason text,
  add column if not exists moderated_by uuid references auth.users(id) on delete set null,
  add column if not exists moderated_at timestamptz;

create index if not exists idx_authors_verified on public.authors(is_verified);
create index if not exists idx_authors_suspended on public.authors(is_suspended);

alter table public.book_reviews
  add column if not exists moderation_status text not null default 'approved' check (moderation_status in ('approved', 'flagged', 'hidden', 'removed')),
  add column if not exists moderated_by uuid references auth.users(id) on delete set null,
  add column if not exists moderated_at timestamptz,
  add column if not exists moderation_note text;

create index if not exists idx_book_reviews_moderation on public.book_reviews(moderation_status);

alter table public.comments
  add column if not exists moderation_status text not null default 'approved' check (moderation_status in ('approved', 'flagged', 'hidden', 'removed')),
  add column if not exists moderated_by uuid references auth.users(id) on delete set null,
  add column if not exists moderated_at timestamptz,
  add column if not exists moderation_note text;

create index if not exists idx_comments_moderation on public.comments(moderation_status);

-- 4. Reports Target Expansion & Resolution Fields
alter table public.reports drop constraint if exists reports_target_type_check;
alter table public.reports add constraint reports_target_type_check check (target_type in ('review', 'comment', 'user', 'book', 'chapter', 'author'));

alter table public.reports
  add column if not exists resolved_by uuid references auth.users(id) on delete set null,
  add column if not exists resolved_at timestamptz,
  add column if not exists resolution_notes text,
  add column if not exists action_taken text;

create index if not exists idx_reports_status on public.reports(status);

-- 5. Admin Audit Logs (Append-Only)
create table if not exists public.admin_audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid not null references auth.users(id) on delete cascade,
  action text not null,
  target_type text not null check (target_type in ('user', 'author', 'book', 'chapter', 'review', 'comment', 'report', 'system')),
  target_id text not null,
  target_title text,
  reason text,
  details jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_audit_logs_actor on public.admin_audit_logs(actor_id);
create index if not exists idx_audit_logs_target on public.admin_audit_logs(target_type, target_id);
create index if not exists idx_audit_logs_created_at on public.admin_audit_logs(created_at desc);

-- 6. Seed Initial Admin Account
update public.profiles
set role = 'admin'
where id = '81c3be6c-96a1-457e-bf55-5137e12c316c' or username = 'dharsit';

-- 7. Trigger to Prevent Regular Users From Privilege Escalation in profiles
create or replace function public.protect_profile_roles()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (old.role is distinct from new.role) or (old.is_suspended is distinct from new.is_suspended) then
    if not public.is_admin(auth.uid()) then
      new.role := old.role;
      new.is_suspended := old.is_suspended;
      new.suspended_at := old.suspended_at;
      new.suspension_reason := old.suspension_reason;
      new.suspended_by := old.suspended_by;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_protect_profile_roles on public.profiles;
create trigger trg_protect_profile_roles
before update on public.profiles
for each row execute function public.protect_profile_roles();

-- 8. Row Level Security Policies

-- Admin Audit Logs: Append-only
alter table public.admin_audit_logs enable row level security;

drop policy if exists "Admins and moderators can view audit logs" on public.admin_audit_logs;
create policy "Admins and moderators can view audit logs"
  on public.admin_audit_logs for select
  to authenticated
  using (public.is_admin_or_moderator((select auth.uid())));

drop policy if exists "Admins and moderators can insert audit logs" on public.admin_audit_logs;
create policy "Admins and moderators can insert audit logs"
  on public.admin_audit_logs for insert
  to authenticated
  with check (public.is_admin_or_moderator((select auth.uid())));

-- Reports RLS
drop policy if exists "Admins and moderators can view all reports" on public.reports;
create policy "Admins and moderators can view all reports"
  on public.reports for select
  to authenticated
  using (public.is_admin_or_moderator((select auth.uid())));

drop policy if exists "Admins and moderators can update reports" on public.reports;
create policy "Admins and moderators can update reports"
  on public.reports for update
  to authenticated
  using (public.is_admin_or_moderator((select auth.uid())))
  with check (public.is_admin_or_moderator((select auth.uid())));

-- Profiles RLS
drop policy if exists "Admins can update any profile" on public.profiles;
create policy "Admins can update any profile"
  on public.profiles for update
  to authenticated
  using (public.is_admin((select auth.uid())));

-- Books RLS
drop policy if exists "Books are viewable if published or author owned" on public.books;
create policy "Books are viewable if published or author owned"
  on public.books for select
  using (
    ((status = 'published' and is_suspended = false) or ((select auth.uid()) = user_id) or public.is_admin_or_moderator((select auth.uid())))
  );

drop policy if exists "Admins and moderators can update any book" on public.books;
create policy "Admins and moderators can update any book"
  on public.books for update
  to authenticated
  using (public.is_admin_or_moderator((select auth.uid())));

-- Chapters RLS
drop policy if exists "Chapters are viewable if published or author owned" on public.chapters;
create policy "Chapters are viewable if published or author owned"
  on public.chapters for select
  using (
    (((status = 'published') and (published_at is null or published_at <= now()) and is_suspended = false) or ((select auth.uid()) = user_id) or public.is_admin_or_moderator((select auth.uid())))
  );

drop policy if exists "Admins and moderators can update any chapter" on public.chapters;
create policy "Admins and moderators can update any chapter"
  on public.chapters for update
  to authenticated
  using (public.is_admin_or_moderator((select auth.uid())));

-- Authors RLS
drop policy if exists "Admins and moderators can update any author" on public.authors;
create policy "Admins and moderators can update any author"
  on public.authors for update
  to authenticated
  using (public.is_admin_or_moderator((select auth.uid())));

-- Reviews RLS
drop policy if exists "Reviews are viewable by everyone" on public.book_reviews;
create policy "Reviews are viewable by everyone"
  on public.book_reviews for select
  using (
    ((moderation_status in ('approved', 'flagged')) or ((select auth.uid()) = user_id) or public.is_admin_or_moderator((select auth.uid())))
  );

drop policy if exists "Admins and moderators can update any review" on public.book_reviews;
create policy "Admins and moderators can update any review"
  on public.book_reviews for update
  to authenticated
  using (public.is_admin_or_moderator((select auth.uid())));

-- Comments RLS
drop policy if exists "Comments are viewable by everyone" on public.comments;
create policy "Comments are viewable by everyone"
  on public.comments for select
  using (
    ((moderation_status in ('approved', 'flagged')) or ((select auth.uid()) = user_id) or public.is_admin_or_moderator((select auth.uid())))
  );

drop policy if exists "Admins and moderators can update any comment" on public.comments;
create policy "Admins and moderators can update any comment"
  on public.comments for update
  to authenticated
  using (public.is_admin_or_moderator((select auth.uid())));
