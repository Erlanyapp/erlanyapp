-- Canonical, extensible taxonomy for the administrative exercise library.
-- Idempotent by slug: preserves any future category records.
insert into public.exercise_categories (name, slug) values
  ('Glúteos', 'gluteos'),
  ('Pernas', 'pernas'),
  ('Costas', 'costas'),
  ('Braços', 'bracos'),
  ('Abdômen', 'abdomen'),
  ('Cardio', 'cardio'),
  ('Alongamento', 'alongamento')
on conflict (slug) do update set name = excluded.name;
