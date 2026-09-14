-- ============================================================
-- Phase 09 Migration: Community, Reviews, Ratings, Follows & Notifications
-- ============================================================

-- 1. Enhance public.authors with follower_count
alter table public.authors add column if not exists follower_count integer not null default 0 check (follower_count >= 0);

-- 2. Create public.book_reviews table
create table if not exists public.book_reviews (
  id uuid primary key default gen_random_uuid(),
  book_id uuid not null references public.books(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  rating integer not null check (rating >= 1 and rating <= 5),
  title text,
  content text not null,
  likes_count integer not null default 0 check (likes_count >= 0),
  comments_count integer not null default 0 check (comments_count >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint unq_book_user_review unique (book_id, user_id)
);

-- 3. Create public.review_likes table
create table if not exists public.review_likes (
  id uuid primary key default gen_random_uuid(),
  review_id uuid not null references public.book_reviews(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint unq_review_user_like unique (review_id, user_id)
);

-- 4. Create public.comments table (for reviews or books)
create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  book_id uuid not null references public.books(id) on delete cascade,
  review_id uuid references public.book_reviews(id) on delete cascade,
  parent_id uuid references public.comments(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 5. Create public.author_follows table
create table if not exists public.author_follows (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.authors(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint unq_author_user_follow unique (author_id, user_id)
);

-- 6. Create public.notifications table
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  actor_id uuid references auth.users(id) on delete set null,
  type text not null check (type in ('review_like', 'review_comment', 'book_comment', 'author_new_chapter', 'author_follow', 'system')),
  title text not null,
  message text not null,
  link text,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

-- 7. Create public.reports table (moderation-ready)
create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references auth.users(id) on delete cascade,
  target_type text not null check (target_type in ('review', 'comment', 'user')),
  target_id uuid not null,
  reason text not null check (reason in ('spam', 'harassment', 'inappropriate', 'spoiler', 'other')),
  details text,
  status text not null default 'pending' check (status in ('pending', 'reviewed', 'dismissed', 'actioned')),
  created_at timestamptz not null default now(),
  constraint unq_report_submission unique (reporter_id, target_type, target_id)
);

-- ============================================================
-- Indexes for High-Performance Social Queries
-- ============================================================
create index if not exists idx_book_reviews_book_created on public.book_reviews(book_id, created_at desc);
create index if not exists idx_book_reviews_user_id on public.book_reviews(user_id);
create index if not exists idx_book_reviews_likes on public.book_reviews(book_id, likes_count desc);
create index if not exists idx_book_reviews_rating on public.book_reviews(book_id, rating desc);

create index if not exists idx_review_likes_review on public.review_likes(review_id);
create index if not exists idx_review_likes_user on public.review_likes(user_id);

create index if not exists idx_comments_book_created on public.comments(book_id, created_at desc);
create index if not exists idx_comments_review on public.comments(review_id) where review_id is not null;
create index if not exists idx_comments_parent on public.comments(parent_id) where parent_id is not null;

create index if not exists idx_author_follows_author on public.author_follows(author_id);
create index if not exists idx_author_follows_user on public.author_follows(user_id);

create index if not exists idx_notifications_user_unread on public.notifications(user_id, is_read, created_at desc);
create index if not exists idx_reports_target on public.reports(target_type, target_id);
create index if not exists idx_reports_reporter on public.reports(reporter_id);

-- ============================================================
-- Database Triggers for Automatic Metric Consistency
-- ============================================================

-- 1. Sync Books Average Rating & Ratings Count
create or replace function public.handle_review_rating_sync()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_book_id uuid;
begin
  if tg_op = 'DELETE' then
    target_book_id := old.book_id;
  else
    target_book_id := new.book_id;
  end if;

  update public.books
  set average_rating = coalesce((
    select round(avg(rating)::numeric, 2)
    from public.book_reviews
    where book_id = target_book_id
  ), 0.00),
  ratings_count = coalesce((
    select count(*)
    from public.book_reviews
    where book_id = target_book_id
  ), 0),
  updated_at = now()
  where id = target_book_id;

  return null;
end;
$$;

drop trigger if exists trg_sync_book_review_rating on public.book_reviews;
create trigger trg_sync_book_review_rating
after insert or update of rating or delete on public.book_reviews
for each row execute function public.handle_review_rating_sync();

-- 2. Sync Review Likes Count
create or replace function public.handle_review_like_sync()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_review_id uuid;
begin
  if tg_op = 'DELETE' then
    target_review_id := old.review_id;
  else
    target_review_id := new.review_id;
  end if;

  update public.book_reviews
  set likes_count = coalesce((
    select count(*)
    from public.review_likes
    where review_id = target_review_id
  ), 0)
  where id = target_review_id;

  return null;
end;
$$;

drop trigger if exists trg_sync_review_likes on public.review_likes;
create trigger trg_sync_review_likes
after insert or delete on public.review_likes
for each row execute function public.handle_review_like_sync();

-- 3. Sync Review Comments Count
create or replace function public.handle_review_comment_sync()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_review_id uuid;
begin
  if tg_op = 'DELETE' then
    target_review_id := old.review_id;
  else
    target_review_id := new.review_id;
  end if;

  if target_review_id is not null then
    update public.book_reviews
    set comments_count = coalesce((
      select count(*)
      from public.comments
      where review_id = target_review_id
    ), 0)
    where id = target_review_id;
  end if;

  return null;
end;
$$;

drop trigger if exists trg_sync_review_comments on public.comments;
create trigger trg_sync_review_comments
after insert or delete on public.comments
for each row execute function public.handle_review_comment_sync();

-- 4. Sync Author Follower Count
create or replace function public.handle_author_follower_sync()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_author_id uuid;
begin
  if tg_op = 'DELETE' then
    target_author_id := old.author_id;
  else
    target_author_id := new.author_id;
  end if;

  update public.authors
  set follower_count = coalesce((
    select count(*)
    from public.author_follows
    where author_id = target_author_id
  ), 0)
  where id = target_author_id;

  return null;
end;
$$;

drop trigger if exists trg_sync_author_followers on public.author_follows;
create trigger trg_sync_author_followers
after insert or delete on public.author_follows
for each row execute function public.handle_author_follower_sync();

-- ============================================================
-- Row Level Security (RLS) Policies
-- ============================================================

-- Enable RLS on all tables
alter table public.book_reviews enable row level security;
alter table public.review_likes enable row level security;
alter table public.comments enable row level security;
alter table public.author_follows enable row level security;
alter table public.notifications enable row level security;
alter table public.reports enable row level security;

-- Book Reviews RLS
drop policy if exists "Reviews are viewable by everyone" on public.book_reviews;
create policy "Reviews are viewable by everyone"
  on public.book_reviews for select
  using (true);

drop policy if exists "Users can insert their own review" on public.book_reviews;
create policy "Users can insert their own review"
  on public.book_reviews for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update their own review" on public.book_reviews;
create policy "Users can update their own review"
  on public.book_reviews for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete their own review" on public.book_reviews;
create policy "Users can delete their own review"
  on public.book_reviews for delete
  to authenticated
  using ((select auth.uid()) = user_id);

-- Review Likes RLS
drop policy if exists "Likes are viewable by everyone" on public.review_likes;
create policy "Likes are viewable by everyone"
  on public.review_likes for select
  using (true);

drop policy if exists "Users can like reviews" on public.review_likes;
create policy "Users can like reviews"
  on public.review_likes for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can remove their like" on public.review_likes;
create policy "Users can remove their like"
  on public.review_likes for delete
  to authenticated
  using ((select auth.uid()) = user_id);

-- Comments RLS
drop policy if exists "Comments are viewable by everyone" on public.comments;
create policy "Comments are viewable by everyone"
  on public.comments for select
  using (true);

drop policy if exists "Users can insert comments" on public.comments;
create policy "Users can insert comments"
  on public.comments for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update their own comment" on public.comments;
create policy "Users can update their own comment"
  on public.comments for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete their own comment" on public.comments;
create policy "Users can delete their own comment"
  on public.comments for delete
  to authenticated
  using ((select auth.uid()) = user_id);

-- Author Follows RLS
drop policy if exists "Author follows are viewable by everyone" on public.author_follows;
create policy "Author follows are viewable by everyone"
  on public.author_follows for select
  using (true);

drop policy if exists "Users can follow authors" on public.author_follows;
create policy "Users can follow authors"
  on public.author_follows for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can unfollow authors" on public.author_follows;
create policy "Users can unfollow authors"
  on public.author_follows for delete
  to authenticated
  using ((select auth.uid()) = user_id);

-- Notifications RLS (Private to recipient)
drop policy if exists "Users can view their own notifications" on public.notifications;
create policy "Users can view their own notifications"
  on public.notifications for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can update their own notifications" on public.notifications;
create policy "Users can update their own notifications"
  on public.notifications for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete their own notifications" on public.notifications;
create policy "Users can delete their own notifications"
  on public.notifications for delete
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Authenticated users or triggers can insert notifications" on public.notifications;
create policy "Authenticated users or triggers can insert notifications"
  on public.notifications for insert
  to authenticated
  with check (true);

-- Reports RLS
drop policy if exists "Users can submit reports" on public.reports;
create policy "Users can submit reports"
  on public.reports for insert
  to authenticated
  with check ((select auth.uid()) = reporter_id);

drop policy if exists "Users can view their own submitted reports" on public.reports;
create policy "Users can view their own submitted reports"
  on public.reports for select
  to authenticated
  using ((select auth.uid()) = reporter_id);
