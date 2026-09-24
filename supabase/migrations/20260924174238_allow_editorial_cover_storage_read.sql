-- Phase 4.5: editorial covers remain private, but clients who can read a
-- released tip or recipe must be able to obtain its short-lived signed URL.
-- The EXISTS clauses inherit the RLS rules on tips/recipes, so inactive or
-- unrelated CLIENT content does not grant Storage access.
drop policy if exists "editorial cover read" on storage.objects;
create policy "editorial cover read"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'images'
    and (
      exists (
        select 1
        from public.tips tip
        join public.media_assets asset on asset.id = tip.image_asset_id
        where asset.bucket = bucket_id
          and asset.path = name
      )
      or exists (
        select 1
        from public.recipes recipe
        join public.media_assets asset on asset.id = recipe.image_asset_id
        where asset.bucket = bucket_id
          and asset.path = name
      )
    )
  );
