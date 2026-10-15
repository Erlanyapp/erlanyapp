-- The admin media library must filter and page in PostgreSQL rather than loading
-- every private asset into the application process. This view is explicitly
-- SECURITY INVOKER: the caller's existing RLS policies on every base table still
-- apply, and only an ADMIN can receive rows from the view itself.

create index if not exists media_assets_created_id_idx
  on public.media_assets (created_at desc, id desc);
create index if not exists videos_created_id_idx
  on public.videos (created_at desc, id desc);
create index if not exists exercises_thumbnail_asset_idx
  on public.exercises (thumbnail_asset_id) where thumbnail_asset_id is not null;
create index if not exists workouts_cover_asset_idx
  on public.workouts (cover_asset_id) where cover_asset_id is not null;
create index if not exists tips_image_asset_idx
  on public.tips (image_asset_id) where image_asset_id is not null;
create index if not exists recipes_image_asset_idx
  on public.recipes (image_asset_id) where image_asset_id is not null;
create index if not exists progress_photos_asset_idx
  on public.progress_photos (asset_id) where asset_id is not null;
create index if not exists workout_exercises_video_idx
  on public.workout_exercises (video_id) where video_id is not null;

create or replace view public.admin_media_library
with (security_invoker = true)
as
with library as (
  select
    asset.id, 'image'::text as kind, asset.title, asset.scope, asset.client_id,
    asset.asset_type as media_type, asset.bucket, asset.path, asset.metadata,
    null::text as provider_video_id, null::text as description, null::boolean as is_active,
    asset.created_at, asset.updated_at,
    case when exists (
      select 1 from public.exercises where thumbnail_asset_id = asset.id
      union all select 1 from public.workouts where cover_asset_id = asset.id
      union all select 1 from public.tips where image_asset_id = asset.id
      union all select 1 from public.recipes where image_asset_id = asset.id
      union all select 1 from public.progress_photos where asset_id = asset.id
    ) then 1::bigint else 0::bigint end as reference_count,
    profile.full_name as client_name
  from public.media_assets asset
  left join public.clients client on client.id = asset.client_id
  left join public.profiles profile on profile.id = client.user_id
  union all
  select
    video.id, 'video'::text as kind, video.title, video.scope, video.client_id,
    video.type as media_type, null::text as bucket, null::text as path, '{}'::jsonb as metadata,
    video.provider_video_id, video.description, video.is_active,
    video.created_at, video.updated_at,
    case when exists (
      select 1 from public.exercises where video_id = video.id
      union all select 1 from public.workout_exercises where video_id = video.id
    ) then 1::bigint else 0::bigint end as reference_count,
    profile.full_name as client_name
  from public.videos video
  left join public.clients client on client.id = video.client_id
  left join public.profiles profile on profile.id = client.user_id
)
select * from library
where (select auth.jwt() -> 'app_metadata' ->> 'role') = 'ADMIN';

revoke all on public.admin_media_library from public, anon;
grant select on public.admin_media_library to authenticated;
notify pgrst, 'reload schema';
