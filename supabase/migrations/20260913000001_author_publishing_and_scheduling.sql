-- Taleora Phase 07 Database Migration
-- Author Publishing System & Chapter Release Scheduling

-- 1. Authors Table: Add user_id
alter table public.authors
  add column if not exists user_id uuid unique references public.profiles(id) on delete cascade;

create index if not exists idx_authors_user_id on public.authors(user_id);

-- Authors RLS Policies
create policy "Authors can insert their own author profile"
  on public.authors for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Authors can update their own author profile"
  on public.authors for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Authors can delete their own author profile"
  on public.authors for delete
  to authenticated
  using ((select auth.uid()) = user_id);

-- 2. Books Table: Add user_id and release_schedule
alter table public.books
  add column if not exists user_id uuid references public.profiles(id) on delete cascade,
  add column if not exists release_schedule text not null default 'immediate'
    check (release_schedule in ('immediate', 'manual', 'weekly', 'biweekly', 'monthly', 'custom'));

create index if not exists idx_books_user_id on public.books(user_id);

-- Books RLS Policies
drop policy if exists "Published books are viewable by everyone" on public.books;
drop policy if exists "Books are viewable if published or author owned" on public.books;

create policy "Books are viewable if published or author owned"
  on public.books for select
  using (
    status = 'published'
    or (select auth.uid()) = user_id
  );

create policy "Authors can insert their own books"
  on public.books for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Authors can update their own books"
  on public.books for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Authors can delete their own books"
  on public.books for delete
  to authenticated
  using ((select auth.uid()) = user_id);

-- 3. Book Genres RLS Policies
create policy "Authors can insert book genres for their books"
  on public.book_genres for insert
  to authenticated
  with check (
    exists (
      select 1 from public.books b
      where b.id = book_genres.book_id
        and b.user_id = (select auth.uid())
    )
  );

create policy "Authors can delete book genres for their books"
  on public.book_genres for delete
  to authenticated
  using (
    exists (
      select 1 from public.books b
      where b.id = book_genres.book_id
        and b.user_id = (select auth.uid())
    )
  );

-- 4. Chapters Table: Add scheduling fields and user_id
alter table public.chapters
  drop constraint if exists chapters_status_check;

alter table public.chapters
  add constraint chapters_status_check
    check (status in ('draft', 'published', 'scheduled', 'archived'));

alter table public.chapters
  add column if not exists user_id uuid references public.profiles(id) on delete cascade,
  add column if not exists scheduled_for timestamptz,
  add column if not exists published_at timestamptz,
  add column if not exists schedule_type text not null default 'immediate'
    check (schedule_type in ('immediate', 'specific_date', 'weekly', 'biweekly', 'monthly', 'custom'));

create index if not exists idx_chapters_user_id on public.chapters(user_id);
create index if not exists idx_chapters_scheduled_for on public.chapters(scheduled_for) where status = 'scheduled';

-- Chapters RLS Policies
drop policy if exists "Published chapters are viewable by everyone" on public.chapters;
drop policy if exists "Chapters are viewable if published or author owned" on public.chapters;

create policy "Chapters are viewable if published or author owned"
  on public.chapters for select
  using (
    (status = 'published' and (published_at is null or published_at <= now()))
    or (select auth.uid()) = user_id
  );

create policy "Authors can insert chapters for their books"
  on public.chapters for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Authors can update their own chapters"
  on public.chapters for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Authors can delete their own chapters"
  on public.chapters for delete
  to authenticated
  using ((select auth.uid()) = user_id);

-- 5. Stored Procedures: Chapter Reordering
create or replace function public.reorder_chapters(p_book_id uuid, p_chapter_ids uuid[])
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  cid uuid;
  new_num int := 1;
begin
  -- Validate ownership
  if not exists (
    select 1 from public.books
    where id = p_book_id and user_id = (select auth.uid())
  ) then
    raise exception 'Unauthorized to reorder chapters of this book';
  end if;

  -- Temporarily offset numbers to avoid unique constraint collision (keeps chapter_number > 0)
  update public.chapters
  set chapter_number = 1000000 + chapter_number
  where book_id = p_book_id;

  -- Assign new sequential order
  foreach cid in array p_chapter_ids
  loop
    update public.chapters
    set chapter_number = new_num,
        updated_at = now()
    where id = cid and book_id = p_book_id;
    new_num := new_num + 1;
  end loop;
end;
$$;

grant execute on function public.reorder_chapters(uuid, uuid[]) to authenticated;

-- 6. Stored Procedures: Publish Scheduled Chapters
create or replace function public.publish_scheduled_chapters()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  affected_count integer := 0;
begin
  with updated as (
    update public.chapters
    set status = 'published',
        published_at = coalesce(scheduled_for, now()),
        scheduled_for = null,
        updated_at = now()
    where status = 'scheduled'
      and scheduled_for <= now()
    returning id, book_id
  )
  select count(*) into affected_count from updated;

  -- Refresh book totals if any chapters were published
  if affected_count > 0 then
    update public.books b
    set total_chapters = (
          select count(*) from public.chapters c
          where c.book_id = b.id and c.status = 'published'
        ),
        estimated_read_time_minutes = (
          select coalesce(sum(c.estimated_read_minutes), 0) from public.chapters c
          where c.book_id = b.id and c.status = 'published'
        ),
        updated_at = now()
    where id in (
      select distinct book_id from public.chapters
      where status = 'published'
    );
  end if;

  return affected_count;
end;
$$;

grant execute on function public.publish_scheduled_chapters() to authenticated, anon;

-- 7. Supabase Storage: book-covers Bucket
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'book-covers',
  'book-covers',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update set public = true;

-- Storage RLS on book-covers
create policy "Book covers are viewable by everyone"
  on storage.objects for select
  using (bucket_id = 'book-covers');

create policy "Authenticated users can upload book covers"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'book-covers'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "Authors can update their own uploaded covers"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'book-covers'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  )
  with check (
    bucket_id = 'book-covers'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "Authors can delete their own uploaded covers"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'book-covers'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
