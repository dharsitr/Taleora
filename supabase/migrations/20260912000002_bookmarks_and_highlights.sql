-- Taleora Migration: Bookmarks and Highlights
-- Phase 06: Reading position bookmarks, text highlights with colors, notes, and strict RLS

-- 1. Bookmarks Table
create table if not exists public.bookmarks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  book_id uuid not null references public.books(id) on delete cascade,
  chapter_id uuid not null references public.chapters(id) on delete cascade,
  progress_percentage numeric(5, 2) not null default 0.00 check (progress_percentage between 0.00 and 100.00),
  paragraph_index integer not null default 0 check (paragraph_index >= 0),
  label text,
  snippet text,
  created_at timestamptz not null default now()
);

create index if not exists idx_bookmarks_user_id on public.bookmarks(user_id);
create index if not exists idx_bookmarks_chapter_id on public.bookmarks(chapter_id);
create index if not exists idx_bookmarks_book_id on public.bookmarks(book_id);
create index if not exists idx_bookmarks_user_created on public.bookmarks(user_id, created_at desc);

-- 2. Highlights Table
create table if not exists public.highlights (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  book_id uuid not null references public.books(id) on delete cascade,
  chapter_id uuid not null references public.chapters(id) on delete cascade,
  paragraph_index integer not null check (paragraph_index >= 0),
  start_offset integer not null check (start_offset >= 0),
  end_offset integer not null check (end_offset > start_offset),
  selected_text text not null,
  color text not null default 'amber' check (color in ('amber', 'emerald', 'sky', 'rose', 'violet')),
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_highlights_user_id on public.highlights(user_id);
create index if not exists idx_highlights_chapter_id on public.highlights(chapter_id);
create index if not exists idx_highlights_book_id on public.highlights(book_id);
create index if not exists idx_highlights_user_chapter on public.highlights(user_id, chapter_id);
create index if not exists idx_highlights_user_created on public.highlights(user_id, created_at desc);

-- 3. Updated At Trigger for Highlights
create or replace trigger set_highlights_updated_at
  before update on public.highlights
  for each row execute function public.handle_updated_at();

-- 4. Enable Row Level Security (RLS)
alter table public.bookmarks enable row level security;
alter table public.highlights enable row level security;

-- 5. Strict RLS Policies for Bookmarks
create policy "Users can view their own bookmarks"
  on public.bookmarks for select
  using ((select auth.uid()) = user_id);

create policy "Users can insert their own bookmarks"
  on public.bookmarks for insert
  with check ((select auth.uid()) = user_id);

create policy "Users can update their own bookmarks"
  on public.bookmarks for update
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can delete their own bookmarks"
  on public.bookmarks for delete
  using ((select auth.uid()) = user_id);

-- 6. Strict RLS Policies for Highlights
create policy "Users can view their own highlights"
  on public.highlights for select
  using ((select auth.uid()) = user_id);

create policy "Users can insert their own highlights"
  on public.highlights for insert
  with check ((select auth.uid()) = user_id);

create policy "Users can update their own highlights"
  on public.highlights for update
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can delete their own highlights"
  on public.highlights for delete
  using ((select auth.uid()) = user_id);
