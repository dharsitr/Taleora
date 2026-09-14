-- Taleora Migration: Reading Statistics & Gamification
-- Phase 10: Reading sessions, reading goals, achievements catalogue, and user achievements with strict RLS

-- 1. Reading Sessions Table
create table if not exists public.reading_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  book_id uuid not null references public.books(id) on delete cascade,
  chapter_id uuid references public.chapters(id) on delete set null,
  duration_seconds integer not null default 0 check (duration_seconds >= 0),
  pages_read integer not null default 0 check (pages_read >= 0),
  session_date date not null default current_date,
  started_at timestamptz not null default now(),
  ended_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists idx_reading_sessions_user_id on public.reading_sessions(user_id);
create index if not exists idx_reading_sessions_book_id on public.reading_sessions(book_id);
create index if not exists idx_reading_sessions_chapter_id on public.reading_sessions(chapter_id);
create index if not exists idx_reading_sessions_user_date on public.reading_sessions(user_id, session_date desc);
create index if not exists idx_reading_sessions_user_book on public.reading_sessions(user_id, book_id);

-- 2. Reading Goals Table
create table if not exists public.reading_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  daily_minutes_goal integer not null default 15 check (daily_minutes_goal > 0),
  weekly_days_goal integer not null default 5 check (weekly_days_goal between 1 and 7),
  annual_books_goal integer not null default 12 check (annual_books_goal > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint unq_reading_goals_user unique (user_id)
);

create index if not exists idx_reading_goals_user_id on public.reading_goals(user_id);

create or replace trigger set_reading_goals_updated_at
  before update on public.reading_goals
  for each row execute function public.handle_updated_at();

-- 3. Achievements Catalogue Table
create table if not exists public.achievements (
  id text primary key,
  title text not null,
  description text not null,
  category text not null check (category in ('streak', 'volume', 'completion', 'exploration', 'special')),
  tier text not null default 'bronze' check (tier in ('bronze', 'silver', 'gold', 'diamond')),
  icon_name text not null default 'Award',
  target_type text not null check (target_type in ('chapters_read', 'pages_read', 'books_completed', 'minutes_read', 'streak_days', 'genres_read', 'highlights_created', 'night_sessions')),
  target_value integer not null check (target_value > 0),
  order_index integer not null default 0,
  created_at timestamptz not null default now()
);

-- 4. User Achievements Progress Table
create table if not exists public.user_achievements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  achievement_id text not null references public.achievements(id) on delete cascade,
  progress_value integer not null default 0 check (progress_value >= 0),
  is_unlocked boolean not null default false,
  unlocked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint unq_user_achievements unique (user_id, achievement_id)
);

create index if not exists idx_user_achievements_user_id on public.user_achievements(user_id);
create index if not exists idx_user_achievements_achievement_id on public.user_achievements(achievement_id);
create index if not exists idx_user_achievements_user_unlocked on public.user_achievements(user_id, is_unlocked);

create or replace trigger set_user_achievements_updated_at
  before update on public.user_achievements
  for each row execute function public.handle_updated_at();

-- 5. Enable Row Level Security
alter table public.reading_sessions enable row level security;
alter table public.reading_goals enable row level security;
alter table public.achievements enable row level security;
alter table public.user_achievements enable row level security;

-- 6. RLS Policies
-- Reading Sessions (Private to owner)
create policy "Users can view their own reading sessions"
  on public.reading_sessions for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can insert their own reading sessions"
  on public.reading_sessions for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can update their own reading sessions"
  on public.reading_sessions for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can delete their own reading sessions"
  on public.reading_sessions for delete
  to authenticated
  using ((select auth.uid()) = user_id);

-- Reading Goals (Private to owner)
create policy "Users can view their own reading goals"
  on public.reading_goals for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can insert their own reading goals"
  on public.reading_goals for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can update their own reading goals"
  on public.reading_goals for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- Achievements Catalogue (Publicly viewable)
create policy "Achievements catalogue is viewable by all users"
  on public.achievements for select
  to authenticated, anon
  using (true);

-- User Achievements (Private to owner)
create policy "Users can view their own achievement progress"
  on public.user_achievements for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can insert their own achievement progress"
  on public.user_achievements for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can update their own achievement progress"
  on public.user_achievements for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- 7. Seed Achievements Catalogue
insert into public.achievements (id, title, description, category, tier, icon_name, target_type, target_value, order_index)
values
  ('first_chapter', 'First Steps', 'Read your first chapter on Taleora.', 'volume', 'bronze', 'BookOpen', 'chapters_read', 1, 1),
  ('page_turner', 'Page Turner', 'Read at least 50 pages of stories.', 'volume', 'bronze', 'Bookmark', 'pages_read', 50, 2),
  ('bookworm', 'Story Finisher', 'Complete your first full book.', 'completion', 'bronze', 'Award', 'books_completed', 1, 3),
  ('bibliophile', 'Avid Bibliophile', 'Complete 5 full books.', 'completion', 'silver', 'Trophy', 'books_completed', 5, 4),
  ('literary_master', 'Literary Master', 'Complete 10 full books.', 'completion', 'gold', 'Crown', 'books_completed', 10, 5),
  ('streak_3', 'Spark of Routine', 'Read 3 days in a row.', 'streak', 'bronze', 'Flame', 'streak_days', 3, 6),
  ('streak_7', 'Unstoppable Habit', 'Maintain a 7-day reading streak.', 'streak', 'silver', 'Zap', 'streak_days', 7, 7),
  ('streak_30', 'Literary Devotion', 'Maintain an incredible 30-day reading streak.', 'streak', 'diamond', 'Sparkles', 'streak_days', 30, 8),
  ('deep_focus', 'Deep Focus', 'Accumulate 60 minutes of reading time.', 'volume', 'silver', 'Clock', 'minutes_read', 60, 9),
  ('centurion', 'Centurion', 'Accumulate 300 minutes of reading time.', 'volume', 'gold', 'Compass', 'minutes_read', 300, 10),
  ('genre_explorer', 'Genre Explorer', 'Explore and read stories across at least 3 distinct genres.', 'exploration', 'silver', 'Globe', 'genres_read', 3, 11),
  ('midnight_scholar', 'Midnight Scholar', 'Read during the quiet midnight hours (11 PM - 4 AM).', 'special', 'gold', 'Moon', 'night_sessions', 1, 12),
  ('keen_annotator', 'Keen Observer', 'Create 5 bookmarks or text highlights across stories.', 'special', 'bronze', 'Highlighter', 'highlights_created', 5, 13)
on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  category = excluded.category,
  tier = excluded.tier,
  icon_name = excluded.icon_name,
  target_type = excluded.target_type,
  target_value = excluded.target_value,
  order_index = excluded.order_index;
