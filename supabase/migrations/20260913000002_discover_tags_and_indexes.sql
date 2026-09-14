-- Migration: 20260913000002_discover_tags_and_indexes.sql
-- Description: Phase 08 Discover page, tags support, full-text trigram index, and discovery query performance indexes.

-- 1. Add tags column to public.books if not exists
alter table public.books add column if not exists tags text[] default '{}'::text[];

-- 2. Create GIN index on tags
create index if not exists idx_books_tags on public.books using gin(tags);

-- 3. Create compound performance indexes for discovery, filtering, and sorting
create index if not exists idx_books_status_rating on public.books(status, average_rating desc);
create index if not exists idx_books_status_popularity on public.books(status, ratings_count desc);
create index if not exists idx_books_status_published_at on public.books(status, published_at desc nulls last);
create index if not exists idx_books_status_updated_at on public.books(status, updated_at desc);

-- 4. Enable pg_trgm in extensions schema if available
create extension if not exists pg_trgm with schema extensions;

-- 5. Trigram index on books.title
create index if not exists idx_books_title_trgm on public.books using gin (title extensions.gin_trgm_ops);

-- 6. Populate descriptive tags for existing published books
update public.books 
set tags = array['celestial', 'cosmic', 'constellations', 'fantasy', 'adventure', 'cartography']
where slug = 'the-cartographer-of-lost-constellations';

update public.books 
set tags = array['gothic', 'mystery', 'libraries', 'secrets', 'atmospheric', 'glass']
where slug = 'whispers-in-the-archive-of-glass';

update public.books 
set tags = array['steampunk', 'clockwork', 'inventions', 'airships', 'rebellion', 'mechanical']
where slug = 'clockwork-skylines-and-iron-crows';

update public.books 
set tags = array['philosophy', 'parables', 'tranquility', 'wisdom', 'meditation', 'tea']
where slug = 'the-tea-merchants-garden-of-parables';

update public.books 
set tags = array['scifi', 'thriller', 'deep-sea', 'discovery', 'space', 'abyss']
where slug = 'echoes-of-the-obsidian-trench';

update public.books 
set tags = array['literary', 'essays', 'solitude', 'ink', 'memory', 'reflective', 'writing']
where slug = 'a-gentle-solitude-of-ink';
