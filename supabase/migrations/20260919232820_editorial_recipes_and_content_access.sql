-- Phase 4.5: complete the editorial lifecycle without duplicating content tables.
alter table public.recipes
  add column if not exists is_active boolean not null default true,
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists image_asset_id uuid references public.media_assets(id) on delete set null;

alter table public.recipe_ingredients
  add column if not exists unit text,
  add column if not exists notes text;

drop trigger if exists recipes_updated_at on public.recipes;
create trigger recipes_updated_at before update on public.recipes
  for each row execute procedure public.set_updated_at();

create index if not exists recipes_scope_active_created_idx
  on public.recipes(scope, is_active, created_at desc, id desc);
create index if not exists recipes_client_active_created_idx
  on public.recipes(client_id, is_active, created_at desc, id desc)
  where scope = 'CLIENT';
create index if not exists recipes_image_asset_idx
  on public.recipes(image_asset_id)
  where image_asset_id is not null;

-- Content visibility is enforced in the database. The browser cannot retrieve
-- inactive editorial material merely by omitting an application-side filter.
drop policy if exists "global tip read" on public.tips;
create policy "tips released to client" on public.tips
  for select to authenticated
  using (
    ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'ADMIN')
    or (
      is_active
      and (
        scope = 'GLOBAL'
        or client_id in (
          select id from public.clients where user_id = (select auth.uid())
        )
      )
    )
  );

drop policy if exists "recipes released to client" on public.recipes;
create policy "recipes released to client" on public.recipes
  for select to authenticated
  using (
    ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'ADMIN')
    or (
      is_active
      and (
        scope = 'GLOBAL'
        or client_id in (
          select id from public.clients where user_id = (select auth.uid())
        )
        or exists (
          select 1
          from public.nutrition_meals meal
          join public.nutrition_plans plan on plan.id = meal.nutrition_plan_id
          join public.nutrition_assignments assignment on assignment.nutrition_plan_id = plan.id
          join public.nutrition_assignment_schedule schedule on schedule.assignment_id = assignment.id
          join public.clients client on client.id = assignment.client_id
          where meal.recipe_id = recipes.id
            and plan.is_active
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

drop policy if exists "recipe ingredients released through recipe" on public.recipe_ingredients;
create policy "recipe ingredients released through recipe" on public.recipe_ingredients
  for select to authenticated
  using (
    exists (
      select 1
      from public.recipes recipe
      where recipe.id = recipe_ingredients.recipe_id
        and (
          ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'ADMIN')
          or (
            recipe.is_active
            and (
              recipe.scope = 'GLOBAL'
              or recipe.client_id in (
                select id from public.clients where user_id = (select auth.uid())
              )
              or exists (
                select 1
                from public.nutrition_meals meal
                join public.nutrition_plans plan on plan.id = meal.nutrition_plan_id
                join public.nutrition_assignments assignment on assignment.nutrition_plan_id = plan.id
                join public.nutrition_assignment_schedule schedule on schedule.assignment_id = assignment.id
                join public.clients client on client.id = assignment.client_id
                where meal.recipe_id = recipe.id
                  and plan.is_active
                  and assignment.is_active
                  and assignment.starts_on <= (now() at time zone 'America/Sao_Paulo')::date
                  and (assignment.ends_on is null or assignment.ends_on >= (now() at time zone 'America/Sao_Paulo')::date)
                  and schedule.is_available
                  and schedule.weekday = ((extract(isodow from (now() at time zone 'America/Sao_Paulo'))::integer + 6) % 7)
                  and client.user_id = (select auth.uid())
              )
            )
          )
        )
    )
  );
