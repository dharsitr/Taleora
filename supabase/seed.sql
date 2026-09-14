-- Taleora Seed Data
-- Seed file intentionally empty for production.
-- Real books and authors are imported via the Taleora Studio or admin panel.
-- Genres are seeded below as they are required taxonomy.

insert into public.genres (name, slug, description)
values
  ('Celestial Fantasy',    'celestial-fantasy',    'Tales set among stars, nebulae, and mythical cosmic currents.'),
  ('Gothic Mystery',       'gothic-mystery',        'Atmospheric labyrinths, crystalline libraries, and shadowy secrets.'),
  ('Steampunk Fiction',    'steampunk-fiction',     'Clockwork inventions, soaring airships, and brass rebellions.'),
  ('Philosophical Fiction','philosophical-fiction', 'Meditative narratives exploring wisdom, choice, and tranquility.'),
  ('Sci-Fi Thriller',      'scifi-thriller',        'High-stakes discoveries on the frontier of deep space and ocean depths.'),
  ('Literary Essays',      'literary-essays',       'Meditative reflections on solitude, paper stationery, and memory.'),
  ('Romance',              'romance',               'Stories of love, longing, and human connection.'),
  ('Historical Fiction',   'historical-fiction',    'Narratives rooted in specific eras of human history.'),
  ('Contemporary Fiction', 'contemporary-fiction',  'Stories set in the modern world exploring everyday life and relationships.'),
  ('Poetry',               'poetry',                'Verse and lyrical expression in long and short form.')
on conflict (slug) do nothing;
