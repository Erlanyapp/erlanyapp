-- Phase 4.7 / Stage 1: assessment foundation for the existing progress history.
-- Existing progress rows remain valid without an assessment association.

create table if not exists public.progress_assessments (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  assessed_at date not null,
  notes text,
  assessed_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.progress_weights
  add column if not exists assessment_id uuid references public.progress_assessments(id) on delete set null;
alter table public.progress_measurements
  add column if not exists assessment_id uuid references public.progress_assessments(id) on delete set null;
alter table public.progress_photos
  add column if not exists assessment_id uuid references public.progress_assessments(id) on delete set null;
alter table public.performance_records
  add column if not exists assessment_id uuid references public.progress_assessments(id) on delete set null;

create index if not exists progress_assessments_client_date_idx
  on public.progress_assessments(client_id, assessed_at desc, id desc);
create index if not exists progress_weights_assessment_idx
  on public.progress_weights(assessment_id) where assessment_id is not null;
create index if not exists progress_measurements_assessment_idx
  on public.progress_measurements(assessment_id) where assessment_id is not null;
create index if not exists progress_photos_assessment_idx
  on public.progress_photos(assessment_id) where assessment_id is not null;
create index if not exists performance_records_assessment_idx
  on public.performance_records(assessment_id) where assessment_id is not null;

create trigger progress_assessments_updated_at
  before update on public.progress_assessments
  for each row execute procedure public.set_updated_at();

-- A referenced asset is evidence of a progress photo and must not be silently
-- detached by deleting the metadata row. Storage object lifecycle remains
-- managed by the existing media library.
alter table public.progress_photos
  drop constraint if exists progress_photos_asset_id_fkey;
alter table public.progress_photos
  add constraint progress_photos_asset_id_fkey
  foreign key (asset_id) references public.media_assets(id) on delete restrict;

-- Cross-table ownership cannot be expressed with a CHECK constraint. These
-- triggers enforce it for new or changed relations without rewriting legacy
-- progress history.
create or replace function public.enforce_progress_photo_asset_integrity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  asset_client_id uuid;
  asset_scope public.content_scope;
  asset_type text;
begin
  if new.asset_id is null then
    return new;
  end if;

  select client_id, scope, asset_type
    into asset_client_id, asset_scope, asset_type
    from public.media_assets
   where id = new.asset_id;

  if not found then
    raise exception 'Progress photo asset does not exist';
  end if;

  if asset_scope <> 'CLIENT'
    or asset_client_id is distinct from new.client_id
    or asset_type <> 'progress' then
    raise exception 'Progress photo asset must be a CLIENT progress asset owned by the same client';
  end if;

  return new;
end;
$$;
revoke all on function public.enforce_progress_photo_asset_integrity() from public;

drop trigger if exists progress_photos_asset_integrity on public.progress_photos;
create trigger progress_photos_asset_integrity
  before insert or update of client_id, asset_id on public.progress_photos
  for each row execute function public.enforce_progress_photo_asset_integrity();

create or replace function public.prevent_referenced_progress_asset_mismatch()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if exists (
    select 1
      from public.progress_photos photo
     where photo.asset_id = new.id
       and (
         new.scope <> 'CLIENT'
         or new.client_id is distinct from photo.client_id
         or new.asset_type <> 'progress'
       )
  ) then
    raise exception 'A referenced progress asset cannot change owner, scope, or type';
  end if;

  return new;
end;
$$;
revoke all on function public.prevent_referenced_progress_asset_mismatch() from public;

drop trigger if exists media_assets_progress_reference_integrity on public.media_assets;
create trigger media_assets_progress_reference_integrity
  before update of client_id, scope, asset_type on public.media_assets
  for each row execute function public.prevent_referenced_progress_asset_mismatch();

alter table public.progress_assessments enable row level security;
revoke all on table public.progress_assessments from anon, public;
grant select, insert, update, delete on table public.progress_assessments to authenticated;

drop policy if exists "admin full access progress assessments" on public.progress_assessments;
create policy "admin full access progress assessments"
  on public.progress_assessments
  for all to authenticated
  using ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'ADMIN')
  with check ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'ADMIN');

drop policy if exists "clients read own progress assessments" on public.progress_assessments;
create policy "clients read own progress assessments"
  on public.progress_assessments
  for select to authenticated
  using (client_id in (
    select id from public.clients where user_id = (select auth.uid())
  ));
