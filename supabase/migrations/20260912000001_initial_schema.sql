-- Taleora Initial Database Schema
-- Phase 02: Core Schema, Constraints, Indexes & RLS Policies

-- 1. Profiles Table
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  full_name text,
  avatar_url text,
  bio text,
  daily_reading_goal_minutes integer not null default 30 check (daily_reading_goal_minutes between 5 and 360),
  streak_days integer not null default 0 check (streak_days >= 0),
  last_read_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint username_length check (char_length(username) between 3 and 30)
);

create index if not exists idx_profiles_username on public.profiles(username);

-- 2. Authors Table
create table if not exists public.authors (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  bio text,
  avatar_url text,
  website text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_authors_slug on public.authors(slug);

-- 3. Books Table
create table if not exists public.books (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text unique not null,
  subtitle text,
  description text,
  author_id uuid not null references public.authors(id) on delete cascade,
  cover_gradient text default 'from-amber-700 via-stone-800 to-zinc-950',
  cover_accent text default '#E28743',
  cover_image_url text,
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  featured boolean not null default false,
  trending boolean not null default false,
  estimated_read_time_minutes integer not null default 0 check (estimated_read_time_minutes >= 0),
  total_chapters integer not null default 0 check (total_chapters >= 0),
  average_rating numeric(3, 2) not null default 0.00 check (average_rating between 0.00 and 5.00),
  ratings_count integer not null default 0 check (ratings_count >= 0),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_books_author_id on public.books(author_id);
create index if not exists idx_books_slug on public.books(slug);
create index if not exists idx_books_status_featured on public.books(status, featured);
create index if not exists idx_books_status_trending on public.books(status, trending);
create index if not exists idx_books_created_at on public.books(created_at desc);

-- 4. Genres Table
create table if not exists public.genres (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  slug text unique not null,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_genres_slug on public.genres(slug);

-- 5. Book_Genres Junction Table
create table if not exists public.book_genres (
  book_id uuid not null references public.books(id) on delete cascade,
  genre_id uuid not null references public.genres(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (book_id, genre_id)
);

create index if not exists idx_book_genres_book_id on public.book_genres(book_id);
create index if not exists idx_book_genres_genre_id on public.book_genres(genre_id);

-- 6. Chapters Table
create table if not exists public.chapters (
  id uuid primary key default gen_random_uuid(),
  book_id uuid not null references public.books(id) on delete cascade,
  chapter_number integer not null check (chapter_number > 0),
  title text not null,
  slug text not null,
  content text not null,
  word_count integer not null default 0 check (word_count >= 0),
  estimated_read_minutes integer not null default 1 check (estimated_read_minutes > 0),
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint unq_chapters_book_number unique (book_id, chapter_number),
  constraint unq_chapters_book_slug unique (book_id, slug)
);

create index if not exists idx_chapters_book_id on public.chapters(book_id);
create index if not exists idx_chapters_book_number on public.chapters(book_id, chapter_number);
create index if not exists idx_chapters_status on public.chapters(status);

-- 7. Reading Progress Table
create table if not exists public.reading_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  book_id uuid not null references public.books(id) on delete cascade,
  current_chapter_id uuid references public.chapters(id) on delete set null,
  progress_percentage numeric(5, 2) not null default 0.00 check (progress_percentage between 0.00 and 100.00),
  is_completed boolean not null default false,
  completed_at timestamptz,
  last_read_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint unq_reading_progress_user_book unique (user_id, book_id)
);

create index if not exists idx_reading_progress_user_id on public.reading_progress(user_id);
create index if not exists idx_reading_progress_book_id on public.reading_progress(book_id);
create index if not exists idx_reading_progress_current_chapter_id on public.reading_progress(current_chapter_id);
create index if not exists idx_reading_progress_user_last_read on public.reading_progress(user_id, last_read_at desc);

-- 8. Updated At Trigger Function
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

revoke execute on function public.handle_updated_at() from public, anon, authenticated;

create or replace trigger set_profiles_updated_at
  before update on public.profiles
  for each row execute function public.handle_updated_at();

create or replace trigger set_authors_updated_at
  before update on public.authors
  for each row execute function public.handle_updated_at();

create or replace trigger set_books_updated_at
  before update on public.books
  for each row execute function public.handle_updated_at();

create or replace trigger set_genres_updated_at
  before update on public.genres
  for each row execute function public.handle_updated_at();

create or replace trigger set_chapters_updated_at
  before update on public.chapters
  for each row execute function public.handle_updated_at();

create or replace trigger set_reading_progress_updated_at
  before update on public.reading_progress
  for each row execute function public.handle_updated_at();

-- 9. Auto-create Profile Trigger on auth.users Signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, username, full_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', 'reader_' || substr(new.id::text, 1, 8)),
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', 'Avid Reader'),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 10. Enable Row Level Security (RLS) on all 7 tables
alter table public.profiles enable row level security;
alter table public.authors enable row level security;
alter table public.books enable row level security;
alter table public.genres enable row level security;
alter table public.book_genres enable row level security;
alter table public.chapters enable row level security;
alter table public.reading_progress enable row level security;

-- 11. Define RLS Policies with Cached auth.uid() subqueries
-- Profiles
create policy "Public profiles are viewable by everyone"
  on public.profiles for select
  using (true);

create policy "Users can insert their own profile"
  on public.profiles for insert
  with check ((select auth.uid()) = id);

create policy "Users can update their own profile"
  on public.profiles for update
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- Authors
create policy "Authors are viewable by everyone"
  on public.authors for select
  using (true);

-- Books
create policy "Published books are viewable by everyone"
  on public.books for select
  using (status = 'published');

-- Genres
create policy "Genres are viewable by everyone"
  on public.genres for select
  using (true);

-- Book Genres
create policy "Book genres are viewable by everyone"
  on public.book_genres for select
  using (true);

-- Chapters
create policy "Published chapters are viewable by everyone"
  on public.chapters for select
  using (status = 'published');

-- Reading Progress
create policy "Users can view their own reading progress"
  on public.reading_progress for select
  using ((select auth.uid()) = user_id);

create policy "Users can insert their own reading progress"
  on public.reading_progress for insert
  with check ((select auth.uid()) = user_id);

create policy "Users can update their own reading progress"
  on public.reading_progress for update
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can delete their own reading progress"
  on public.reading_progress for delete
  using ((select auth.uid()) = user_id);
