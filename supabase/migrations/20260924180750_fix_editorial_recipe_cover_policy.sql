-- Phase 4.5: qualify the outer Storage columns. `recipes` also has a `name`
-- column, so an unqualified reference would never match object paths.
drop policy if exists "editorial cover read" on storage.objects;
create policy "editorial cover read"
  on storage.objects for select to authenticated
  using (
    storage.objects.bucket_id = 'images'
    and (
      exists (
        select 1
        from public.tips tip
        join public.media_assets asset on asset.id = tip.image_asset_id
        where asset.bucket = storage.objects.bucket_id
          and asset.path = storage.objects.name
      )
      or exists (
        select 1
        from public.recipes recipe
        join public.media_assets asset on asset.id = recipe.image_asset_id
        where asset.bucket = storage.objects.bucket_id
          and asset.path = storage.objects.name
      )
    )
  );
