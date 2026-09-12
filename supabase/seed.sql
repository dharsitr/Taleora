-- Taleora Seed Data
-- Literary stories, genres, authors, and chapters
do $$
declare
  v_author_elian uuid;
  v_author_mira uuid;
  v_author_kaelen uuid;
  v_author_sora uuid;
  
  v_genre_fantasy uuid;
  v_genre_mystery uuid;
  v_genre_steampunk uuid;
  v_genre_philosophy uuid;
  v_genre_scifi uuid;

  v_book_cartographer uuid;
  v_book_archive uuid;
  v_book_clockwork uuid;
  v_book_tea uuid;
begin
  -- Authors
  insert into public.authors (name, slug, bio, website)
  values
    ('Elian Vance', 'elian-vance', 'Astronomer and mythologist exploring celestial boundaries.', 'https://elianvance.me')
  on conflict (slug) do update set name = excluded.name
  returning id into v_author_elian;

  insert into public.authors (name, slug, bio)
  values
    ('Mira Thorne', 'mira-thorne', 'Archival historian captivated by forgotten manuscripts and crystalline architecture.')
  on conflict (slug) do update set name = excluded.name
  returning id into v_author_mira;

  insert into public.authors (name, slug, bio)
  values
    ('Kaelen Mercer', 'kaelen-mercer', 'Speculative fiction author focused on airborne cities and mechanical revolutions.')
  on conflict (slug) do update set name = excluded.name
  returning id into v_author_kaelen;

  insert into public.authors (name, slug, bio)
  values
    ('Sora Lin', 'sora-lin', 'Writer of contemplative parables and mindful tea-house journeys.')
  on conflict (slug) do update set name = excluded.name
  returning id into v_author_sora;

  -- Genres
  insert into public.genres (name, slug, description)
  values ('Celestial Fantasy', 'celestial-fantasy', 'Tales set among stars, nebulae, and mythical cosmic currents.')
  on conflict (slug) do update set name = excluded.name
  returning id into v_genre_fantasy;

  insert into public.genres (name, slug, description)
  values ('Gothic Mystery', 'gothic-mystery', 'Atmospheric labyrinths, crystalline libraries, and shadowy secrets.')
  on conflict (slug) do update set name = excluded.name
  returning id into v_genre_mystery;

  insert into public.genres (name, slug, description)
  values ('Steampunk Fiction', 'steampunk-fiction', 'Clockwork inventions, soaring airships, and brass rebellions.')
  on conflict (slug) do update set name = excluded.name
  returning id into v_genre_steampunk;

  insert into public.genres (name, slug, description)
  values ('Philosophical Fiction', 'philosophical-fiction', 'Meditative narratives exploring wisdom, choice, and tranquility.')
  on conflict (slug) do update set name = excluded.name
  returning id into v_genre_philosophy;

  insert into public.genres (name, slug, description)
  values ('Sci-Fi Thriller', 'scifi-thriller', 'High-stakes discoveries on the frontier of deep space and ocean depths.')
  on conflict (slug) do update set name = excluded.name
  returning id into v_genre_scifi;

  -- Books
  insert into public.books (
    title, slug, subtitle, description, author_id,
    cover_gradient, cover_accent, status, featured, trending,
    estimated_read_time_minutes, total_chapters, average_rating, ratings_count, published_at
  )
  values (
    'The Cartographer of Lost Constellations',
    'the-cartographer-of-lost-constellations',
    'A journey through uncharted star-routes and forgotten memories',
    'When an astronomer maps a rogue nebula, she uncovers ancient celestial paths carved by dreamers centuries before.',
    v_author_elian,
    'from-amber-700 via-stone-800 to-zinc-950',
    '#E28743',
    'published',
    true,
    false,
    280,
    24,
    4.90,
    1420,
    now()
  )
  on conflict (slug) do update set title = excluded.title
  returning id into v_book_cartographer;

  insert into public.books (
    title, slug, subtitle, description, author_id,
    cover_gradient, cover_accent, status, featured, trending,
    estimated_read_time_minutes, total_chapters, average_rating, ratings_count, published_at
  )
  values (
    'Whispers in the Archive of Glass',
    'whispers-in-the-archive-of-glass',
    'Every memory has an echo, if you listen closely enough',
    'A quiet archivist in a crystalline library discovers that certain preserved transcripts bleed real ink into the present.',
    v_author_mira,
    'from-emerald-800 via-teal-950 to-stone-900',
    '#34D399',
    'published',
    false,
    true,
    340,
    30,
    4.80,
    890,
    now()
  )
  on conflict (slug) do update set title = excluded.title
  returning id into v_book_archive;

  insert into public.books (
    title, slug, subtitle, description, author_id,
    cover_gradient, cover_accent, status, featured, trending,
    estimated_read_time_minutes, total_chapters, average_rating, ratings_count, published_at
  )
  values (
    'Clockwork Skylines & Iron Crows',
    'clockwork-skylines-and-iron-crows',
    'Steam, soot, and the rebellion taking wing above the clouds',
    'An apprentice mechanic crafts mechanical couriers that begin delivering secrets meant only for the Emperor''s eyes.',
    v_author_kaelen,
    'from-orange-800 via-amber-950 to-neutral-900',
    '#F97316',
    'published',
    false,
    true,
    210,
    18,
    4.70,
    650,
    now()
  )
  on conflict (slug) do update set title = excluded.title
  returning id into v_book_clockwork;

  insert into public.books (
    title, slug, subtitle, description, author_id,
    cover_gradient, cover_accent, status, featured, trending,
    estimated_read_time_minutes, total_chapters, average_rating, ratings_count, published_at
  )
  values (
    'The Tea Merchant''s Garden of Parables',
    'the-tea-merchants-garden-of-parables',
    'Where each brew steeps an old tale into existence',
    'A wandering herbalist settles in a mist-shrouded valley, serving teas that awaken the unspoken truths of his guests.',
    v_author_sora,
    'from-stone-700 via-stone-800 to-stone-950',
    '#EAB308',
    'published',
    true,
    false,
    190,
    16,
    4.95,
    2100,
    now()
  )
  on conflict (slug) do update set title = excluded.title
  returning id into v_book_tea;

  -- Book Genres
  insert into public.book_genres (book_id, genre_id) values
    (v_book_cartographer, v_genre_fantasy),
    (v_book_archive, v_genre_mystery),
    (v_book_clockwork, v_genre_steampunk),
    (v_book_tea, v_genre_philosophy)
  on conflict do nothing;

  -- Chapters
  insert into public.chapters (book_id, chapter_number, title, slug, content, word_count, estimated_read_minutes, status)
  values
    (
      v_book_cartographer,
      1,
      'The Astrolabe at Dusk',
      'the-astrolabe-at-dusk',
      'The brass ring of the equatorial astrolabe caught the final amber flare of the sun as it slipped behind the observatory ridges...',
      1850,
      8,
      'published'
    ),
    (
      v_book_cartographer,
      2,
      'Ink That Never Dries',
      'ink-that-never-dries',
      'She ground the lapis lazuli into fine dust, mixing it with distilled rainwater and the sap of alpine juniper...',
      2100,
      10,
      'published'
    )
  on conflict do nothing;
end $$;
