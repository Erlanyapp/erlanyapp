-- Phase 4.4: nutrition plans remain reusable content while assignments own
-- client distribution, validity period, and weekly availability.
alter table public.nutrition_plans
  add column if not exists objective text,
  add column if not exists notes text,
  add column if not exists is_active boolean not null default true;

alter table public.nutrition_meals
  add column if not exists meal_time time,
  add column if not exists description text;

create table if not exists public.nutrition_meal_items (
  id uuid primary key default gen_random_uuid(),
  nutrition_meal_id uuid not null references public.nutrition_meals(id) on delete cascade,
  food_name text not null,
  quantity numeric(10,2),
  unit text,
  notes text,
  item_order integer not null default 0 check (item_order >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (nutrition_meal_id, item_order)
);

create table if not exists public.nutrition_assignments (
  id uuid primary key default gen_random_uuid(),
  nutrition_plan_id uuid not null references public.nutrition_plans(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete cascade,
  starts_on date not null,
  ends_on date,
  is_active boolean not null default true,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_on is null or ends_on >= starts_on)
);

create table if not exists public.nutrition_assignment_schedule (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.nutrition_assignments(id) on delete cascade,
  weekday smallint not null check (weekday between 0 and 6),
  is_available boolean not null default true,
  created_at timestamptz not null default now(),
  unique (assignment_id, weekday)
);

create index if not exists nutrition_meal_items_meal_order_idx
  on public.nutrition_meal_items(nutrition_meal_id, item_order);
create index if not exists nutrition_assignments_client_period_idx
  on public.nutrition_assignments(client_id, starts_on, ends_on)
  where is_active;
create index if not exists nutrition_assignments_plan_idx
  on public.nutrition_assignments(nutrition_plan_id, created_at desc);
create index if not exists nutrition_assignment_schedule_assignment_idx
  on public.nutrition_assignment_schedule(assignment_id, weekday)
  where is_available;

drop trigger if exists nutrition_meal_items_updated_at on public.nutrition_meal_items;
create trigger nutrition_meal_items_updated_at before update on public.nutrition_meal_items
  for each row execute procedure public.set_updated_at();
drop trigger if exists nutrition_assignments_updated_at on public.nutrition_assignments;
create trigger nutrition_assignments_updated_at before update on public.nutrition_assignments
  for each row execute procedure public.set_updated_at();

alter table public.nutrition_meal_items enable row level security;
alter table public.nutrition_assignments enable row level security;
alter table public.nutrition_assignment_schedule enable row level security;

-- New public-schema tables must be explicitly exposed to the Data API.
grant select on public.nutrition_meal_items, public.nutrition_assignments, public.nutrition_assignment_schedule to authenticated;

drop policy if exists "global nutrition read" on public.nutrition_plans;
create policy "nutrition plans released to client" on public.nutrition_plans
  for select to authenticated
  using (
    ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'ADMIN')
    or (scope = 'GLOBAL' and is_active)
    or exists (
      select 1
      from public.nutrition_assignments assignment
      join public.clients client on client.id = assignment.client_id
      join public.nutrition_assignment_schedule schedule on schedule.assignment_id = assignment.id
      where assignment.nutrition_plan_id = nutrition_plans.id
        and assignment.is_active
        and assignment.starts_on <= (now() at time zone 'America/Sao_Paulo')::date
        and (assignment.ends_on is null or assignment.ends_on >= (now() at time zone 'America/Sao_Paulo')::date)
        and schedule.is_available
        and schedule.weekday = ((extract(isodow from (now() at time zone 'America/Sao_Paulo'))::integer + 6) % 7)
        and client.user_id = (select auth.uid())
    )
  );

drop policy if exists "nutrition meals global or own read" on public.nutrition_meals;
create policy "nutrition meals released through plan" on public.nutrition_meals
  for select to authenticated
  using (
    exists (
      select 1 from public.nutrition_plans plan
      where plan.id = nutrition_meals.nutrition_plan_id
        and (
          (plan.scope = 'GLOBAL' and plan.is_active)
          or exists (
            select 1
            from public.nutrition_assignments assignment
            join public.clients client on client.id = assignment.client_id
            join public.nutrition_assignment_schedule schedule on schedule.assignment_id = assignment.id
            where assignment.nutrition_plan_id = plan.id
              and assignment.is_active
              and assignment.starts_on <= (now() at time zone 'America/Sao_Paulo')::date
              and (assignment.ends_on is null or assignment.ends_on >= (now() at time zone 'America/Sao_Paulo')::date)
              and schedule.is_available
              and schedule.weekday = ((extract(isodow from (now() at time zone 'America/Sao_Paulo'))::integer + 6) % 7)
              and client.user_id = (select auth.uid())
          )
        )
    )
  );

drop policy if exists "global recipe read" on public.recipes;
create policy "recipes released to client" on public.recipes
  for select to authenticated
  using (
    ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'ADMIN')
    or (scope = 'GLOBAL')
    or client_id in (select id from public.clients where user_id = (select auth.uid()))
    or exists (
      select 1
      from public.nutrition_meals meal
      join public.nutrition_plans plan on plan.id = meal.nutrition_plan_id
      join public.nutrition_assignments assignment on assignment.nutrition_plan_id = plan.id
      join public.nutrition_assignment_schedule schedule on schedule.assignment_id = assignment.id
      join public.clients client on client.id = assignment.client_id
      where meal.recipe_id = recipes.id
        and assignment.is_active
        and assignment.starts_on <= (now() at time zone 'America/Sao_Paulo')::date
        and (assignment.ends_on is null or assignment.ends_on >= (now() at time zone 'America/Sao_Paulo')::date)
        and schedule.is_available
        and schedule.weekday = ((extract(isodow from (now() at time zone 'America/Sao_Paulo'))::integer + 6) % 7)
        and client.user_id = (select auth.uid())
    )
  );

drop policy if exists "recipe ingredients global recipe read" on public.recipe_ingredients;
create policy "recipe ingredients released through recipe" on public.recipe_ingredients
  for select to authenticated
  using (
    exists (
      select 1
      from public.recipes recipe
      where recipe.id = recipe_ingredients.recipe_id
        and (
          recipe.scope = 'GLOBAL'
          or recipe.client_id in (select id from public.clients where user_id = (select auth.uid()))
          or exists (
            select 1
            from public.nutrition_meals meal
            join public.nutrition_plans plan on plan.id = meal.nutrition_plan_id
            join public.nutrition_assignments assignment on assignment.nutrition_plan_id = plan.id
            join public.nutrition_assignment_schedule schedule on schedule.assignment_id = assignment.id
            join public.clients client on client.id = assignment.client_id
            where meal.recipe_id = recipe.id
              and assignment.is_active
              and assignment.starts_on <= (now() at time zone 'America/Sao_Paulo')::date
              and (assignment.ends_on is null or assignment.ends_on >= (now() at time zone 'America/Sao_Paulo')::date)
              and schedule.is_available
              and schedule.weekday = ((extract(isodow from (now() at time zone 'America/Sao_Paulo'))::integer + 6) % 7)
              and client.user_id = (select auth.uid())
          )
        )
    )
  );

create policy "nutrition assignments own current read" on public.nutrition_assignments
  for select to authenticated
  using (
    ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'ADMIN')
    or (
      is_active
      and starts_on <= (now() at time zone 'America/Sao_Paulo')::date
      and (ends_on is null or ends_on >= (now() at time zone 'America/Sao_Paulo')::date)
      and client_id in (select id from public.clients where user_id = (select auth.uid()))
    )
  );

create policy "nutrition schedule own assignment read" on public.nutrition_assignment_schedule
  for select to authenticated
  using (
    ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'ADMIN')
    or exists (
      select 1
      from public.nutrition_assignments assignment
      join public.clients client on client.id = assignment.client_id
      where assignment.id = nutrition_assignment_schedule.assignment_id
        and assignment.is_active
        and assignment.starts_on <= (now() at time zone 'America/Sao_Paulo')::date
        and (assignment.ends_on is null or assignment.ends_on >= (now() at time zone 'America/Sao_Paulo')::date)
        and client.user_id = (select auth.uid())
    )
  );

create policy "nutrition meal items released through meal" on public.nutrition_meal_items
  for select to authenticated
  using (
    exists (
      select 1
      from public.nutrition_meals meal
      join public.nutrition_plans plan on plan.id = meal.nutrition_plan_id
      where meal.id = nutrition_meal_items.nutrition_meal_id
        and (
          (plan.scope = 'GLOBAL' and plan.is_active)
          or exists (
            select 1
            from public.nutrition_assignments assignment
            join public.clients client on client.id = assignment.client_id
            join public.nutrition_assignment_schedule schedule on schedule.assignment_id = assignment.id
            where assignment.nutrition_plan_id = plan.id
              and assignment.is_active
              and assignment.starts_on <= (now() at time zone 'America/Sao_Paulo')::date
              and (assignment.ends_on is null or assignment.ends_on >= (now() at time zone 'America/Sao_Paulo')::date)
              and schedule.is_available
              and schedule.weekday = ((extract(isodow from (now() at time zone 'America/Sao_Paulo'))::integer + 6) % 7)
              and client.user_id = (select auth.uid())
          )
        )
    )
  );

create policy "admin full access nutrition meal items" on public.nutrition_meal_items
  for all to authenticated
  using ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'ADMIN')
  with check ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'ADMIN');
create policy "admin full access nutrition assignments" on public.nutrition_assignments
  for all to authenticated
  using ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'ADMIN')
  with check ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'ADMIN');
create policy "admin full access nutrition assignment schedule" on public.nutrition_assignment_schedule
  for all to authenticated
  using ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'ADMIN')
  with check ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'ADMIN');
