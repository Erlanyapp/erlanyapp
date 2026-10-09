-- Avoid an ambiguous PL/pgSQL variable/column name in the Phase 4.7 integrity trigger.
create or replace function public.enforce_progress_photo_asset_integrity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  asset_client_id uuid;
  asset_scope public.content_scope;
  stored_asset_type text;
begin
  if new.asset_id is null then
    return new;
  end if;

  select asset.client_id, asset.scope, asset.asset_type
    into asset_client_id, asset_scope, stored_asset_type
    from public.media_assets asset
   where asset.id = new.asset_id;

  if not found then
    raise exception 'Progress photo asset does not exist';
  end if;

  if asset_scope <> 'CLIENT'
    or asset_client_id is distinct from new.client_id
    or stored_asset_type <> 'progress' then
    raise exception 'Progress photo asset must be a CLIENT progress asset owned by the same client';
  end if;

  return new;
end;
$$;
revoke all on function public.enforce_progress_photo_asset_integrity() from public;
