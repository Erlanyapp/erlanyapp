-- Existing private images bucket and profile column are reused; no data is removed.
-- A restrictive policy also constrains the existing ADMIN image policy for avatars.
create policy "avatar owner boundary" on storage.objects as restrictive for all to authenticated
  using (bucket_id <> 'images' or (storage.foldername(name))[1] is distinct from 'avatars'
    or (storage.foldername(name))[2] = (select auth.uid())::text)
  with check (bucket_id <> 'images' or (storage.foldername(name))[1] is distinct from 'avatars'
    or (storage.foldername(name))[2] = (select auth.uid())::text);
create policy "own avatar access" on storage.objects for all to authenticated
  using (bucket_id = 'images' and (storage.foldername(name))[1] = 'avatars'
    and (storage.foldername(name))[2] = (select auth.uid())::text)
  with check (bucket_id = 'images' and (storage.foldername(name))[1] = 'avatars'
    and (storage.foldername(name))[2] = (select auth.uid())::text);

create function public.guard_profile_update() returns trigger language plpgsql
set search_path = '' as $$
begin
  if auth.uid() is not null then
    if new.id is distinct from old.id or
      (new.role is distinct from old.role and coalesce(auth.jwt()->'app_metadata'->>'role', '') <> 'ADMIN') then
      raise exception 'Profile identity and role cannot be changed by clients';
    end if;
    if new.avatar_url is distinct from old.avatar_url and new.avatar_url is not null
      and new.avatar_url not like 'avatars/' || auth.uid()::text || '/%' then
      raise exception 'Avatar path must belong to the authenticated user';
    end if;
  end if;
  return new;
end; $$;
revoke all on function public.guard_profile_update() from public;
create trigger profiles_guard_update before update on public.profiles
  for each row execute function public.guard_profile_update();

create policy "own weight insert" on public.progress_weights for insert to authenticated
  with check (client_id in (select id from public.clients where user_id = (select auth.uid())));
create policy "own performance read" on public.performance_records for select to authenticated
  using (client_id in (select id from public.clients where user_id = (select auth.uid())));
create policy "earned achievement details read" on public.achievements for select to authenticated
  using (id in (select achievement_id from public.user_achievements where
    client_id in (select id from public.clients where user_id = (select auth.uid()))));
create policy "own support insert" on public.support_messages for insert to authenticated
  with check (sender_id = (select auth.uid()) and status = 'open' and
    client_id in (select id from public.clients where user_id = (select auth.uid())));
