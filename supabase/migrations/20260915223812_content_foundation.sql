
-- Phase 3.1 extends the Phase 0 schema without replacing existing data.
alter table public.exercises add column if not exists slug text;
alter table public.exercises add column if not exists is_active boolean not null default true;
alter table public.exercises add column if not exists updated_at timestamptz not null default now();
update public.exercises set slug = lower(regexp_replace(trim(name), '[^a-zA-Z0-9]+', '-', 'g')) where slug is null;
alter table public.exercises alter column slug set not null;
create unique index if not exists exercises_slug_idx on public.exercises(slug);

alter table public.workouts add column if not exists slug text;
alter table public.workouts add column if not exists is_active boolean not null default true;
update public.workouts set slug = lower(regexp_replace(trim(name), '[^a-zA-Z0-9]+', '-', 'g')) where slug is null;
alter table public.workouts alter column slug set not null;
create unique index if not exists workouts_slug_idx on public.workouts(slug);

alter table public.videos add column if not exists is_active boolean not null default true;
alter table public.videos add constraint videos_provider_check check (provider in ('youtube', 'vimeo', 'storage', 'other'));

alter table public.media_assets add column if not exists title text;
alter table public.media_assets add column if not exists asset_type text not null default 'other';
alter table public.media_assets add column if not exists metadata jsonb not null default '{}';
alter table public.media_assets add column if not exists updated_at timestamptz not null default now();
alter table public.media_assets add constraint media_assets_type_check check (asset_type in ('workout', 'progress', 'massage', 'motivational', 'other'));

alter table public.tips add column if not exists slug text;
alter table public.tips add column if not exists summary text;
alter table public.tips add column if not exists image_asset_id uuid references public.media_assets(id) on delete set null;
alter table public.tips add column if not exists is_active boolean not null default true;
update public.tips set slug = lower(regexp_replace(trim(title), '[^a-zA-Z0-9]+', '-', 'g')) where slug is null;
alter table public.tips alter column slug set not null;
create unique index if not exists tips_slug_idx on public.tips(slug);

alter table public.recipes add column if not exists slug text;
alter table public.recipes add column if not exists prep_time_minutes integer check (prep_time_minutes is null or prep_time_minutes >= 0);
update public.recipes set slug = lower(regexp_replace(trim(name), '[^a-zA-Z0-9]+', '-', 'g')) where slug is null;
alter table public.recipes alter column slug set not null;
create unique index if not exists recipes_slug_idx on public.recipes(slug);

create table if not exists public.nutrition_meals (
  id uuid primary key default gen_random_uuid(),
  nutrition_plan_id uuid not null references public.nutrition_plans(id) on delete cascade,
  name text not null,
  meal_order integer not null default 0,
  guidance text,
  recipe_id uuid references public.recipes(id) on delete set null,
  scope public.content_scope not null default 'GLOBAL',
  client_id uuid references public.clients(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint nutrition_meals_scope_owner check (scope = 'GLOBAL' or client_id is not null),
  unique (nutrition_plan_id, meal_order)
);

create table if not exists public.recipe_ingredients (
  id uuid primary key default gen_random_uuid(),
  recipe_id uuid not null references public.recipes(id) on delete cascade,
  name text not null,
  quantity text,
  ingredient_order integer not null default 0,
  created_at timestamptz not null default now(),
  unique (recipe_id, ingredient_order)
);

alter table public.nutrition_meals enable row level security;
alter table public.recipe_ingredients enable row level security;

create policy "nutrition meals global or own read" on public.nutrition_meals for select to authenticated
  using (scope = 'GLOBAL' or client_id in (select id from public.clients where user_id = (select auth.uid())));
create policy "nutrition meals admin access" on public.nutrition_meals for all to authenticated
  using ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'ADMIN')
  with check ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'ADMIN');
create policy "recipe ingredients global recipe read" on public.recipe_ingredients for select to authenticated
  using (exists (select 1 from public.recipes r where r.id = recipe_id and (r.scope = 'GLOBAL' or r.client_id in (select id from public.clients where user_id = (select auth.uid())))));
create policy "recipe ingredients admin access" on public.recipe_ingredients for all to authenticated
  using ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'ADMIN')
  with check ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'ADMIN');
create policy "media assets global or own read" on public.media_assets for select to authenticated
  using (scope = 'GLOBAL' or client_id in (select id from public.clients where user_id = (select auth.uid())));
create policy "workout exercises accessible workout read" on public.workout_exercises for select to authenticated
  using (exists (select 1 from public.workouts w where w.id = workout_id and (w.scope = 'GLOBAL' or w.client_id in (select id from public.clients where user_id = (select auth.uid())))));

create index if not exists nutrition_meals_plan_order_idx on public.nutrition_meals(nutrition_plan_id, meal_order);
create index if not exists recipe_ingredients_recipe_order_idx on public.recipe_ingredients(recipe_id, ingredient_order);
create index if not exists media_assets_scope_type_idx on public.media_assets(scope, asset_type);
create index if not exists tips_scope_active_idx on public.tips(scope, is_active);

create trigger nutrition_meals_updated_at before update on public.nutrition_meals for each row execute procedure public.set_updated_at();
