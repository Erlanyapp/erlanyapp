-- Library-specific references; videos and media remain normalized and private.
alter table public.exercises
  add column if not exists video_id uuid references public.videos(id) on delete set null,
  add column if not exists thumbnail_asset_id uuid references public.media_assets(id) on delete set null;

create index if not exists exercises_admin_library_idx
  on public.exercises (is_active, category_id, level, equipment, name, id);
create index if not exists exercises_video_idx on public.exercises (video_id) where video_id is not null;
create index if not exists exercises_thumbnail_asset_idx on public.exercises (thumbnail_asset_id) where thumbnail_asset_id is not null;
