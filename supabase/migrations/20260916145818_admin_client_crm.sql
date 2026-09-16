-- Reuse Auth, profiles and clients; no parallel identities or production deletes.
begin;
alter table public.profiles add column email text;
comment on column public.profiles.email is 'Read-only mirror of Auth email, maintained by internal trigger; never an authorization claim.';
update public.profiles p set email = u.email from auth.users u where u.id = p.id;
-- Repair missing profiles before validating the relationship, without losing clients.
insert into public.profiles (id,full_name,email)
select u.id,coalesce(u.raw_user_meta_data->>'full_name',''),u.email
from auth.users u join public.clients c on c.user_id=u.id
where not exists (select 1 from public.profiles p where p.id=u.id);
alter table public.clients add constraint clients_profile_fkey
foreign key (user_id) references public.profiles(id) on delete cascade;

create schema if not exists private;
create function private.sync_profile_email() returns trigger language plpgsql
security definer set search_path = '' as $$
begin
  update public.profiles set email = new.email where id = new.id;
  return new;
end; $$;
revoke all on function private.sync_profile_email() from public,anon,authenticated;
-- Existing Auth insert trigger still creates profile/client exactly as before.
create trigger zz_auth_profile_email_insert after insert on auth.users
for each row execute function private.sync_profile_email();
create trigger auth_profile_email_update after update of email on auth.users
for each row execute function private.sync_profile_email();

create or replace function public.guard_profile_update() returns trigger language plpgsql
set search_path = '' as $$
begin
  if auth.uid() is not null then
    if new.id is distinct from old.id or
      (new.role is distinct from old.role and coalesce(auth.jwt()->'app_metadata'->>'role','') <> 'ADMIN') then
      raise exception 'Profile identity and role cannot be changed by clients';
    end if;
    if new.email is distinct from old.email and current_user not in ('postgres','supabase_auth_admin') then
      raise exception 'Email is managed by Auth';
    end if;
    if new.avatar_url is distinct from old.avatar_url and new.avatar_url is not null
      and new.avatar_url not like 'avatars/' || auth.uid()::text || '/%' then
      raise exception 'Avatar path must belong to the authenticated user';
    end if;
  end if;
  return new;
end; $$;
-- Trigger-initiated email updates have no caller auth.uid() in Auth's DB role.
create policy "admin profiles update" on public.profiles for update to authenticated
using ((select auth.jwt()->'app_metadata'->>'role') = 'ADMIN')
with check ((select auth.jwt()->'app_metadata'->>'role') = 'ADMIN');

-- Separate SELECT from writes: ADMIN can see client photos, never mutate foreign avatars.
drop policy "avatar owner boundary" on storage.objects;
create policy "avatar read boundary" on storage.objects as restrictive for select to authenticated
using (bucket_id <> 'images' or (storage.foldername(name))[1] is distinct from 'avatars'
or (storage.foldername(name))[2] = (select auth.uid())::text
or (select auth.jwt()->'app_metadata'->>'role') = 'ADMIN');
create policy "avatar insert boundary" on storage.objects as restrictive for insert to authenticated
with check (bucket_id <> 'images' or (storage.foldername(name))[1] is distinct from 'avatars'
or (storage.foldername(name))[2] = (select auth.uid())::text);
create policy "avatar update boundary" on storage.objects as restrictive for update to authenticated
using (bucket_id <> 'images' or (storage.foldername(name))[1] is distinct from 'avatars'
or (storage.foldername(name))[2] = (select auth.uid())::text)
with check (bucket_id <> 'images' or (storage.foldername(name))[1] is distinct from 'avatars'
or (storage.foldername(name))[2] = (select auth.uid())::text);
create policy "avatar delete boundary" on storage.objects as restrictive for delete to authenticated
using (bucket_id <> 'images' or (storage.foldername(name))[1] is distinct from 'avatars'
or (storage.foldername(name))[2] = (select auth.uid())::text);

create function public.guard_client_management() returns trigger language plpgsql
set search_path = '' as $$
begin
  if auth.uid() is not null then
    if new.id is distinct from old.id or new.user_id is distinct from old.user_id then
      raise exception 'Client identity is immutable';
    end if;
    if coalesce(auth.jwt()->'app_metadata'->>'role','') <> 'ADMIN' and
      (new.status is distinct from old.status or new.plan_id is distinct from old.plan_id) then
      raise exception 'Client management requires ADMIN';
    end if;
  end if;
  return new;
end; $$;
revoke all on function public.guard_client_management() from public;
create trigger clients_guard_management before update on public.clients
for each row execute function public.guard_client_management();
create index clients_created_id_idx on public.clients(created_at desc,id desc);
create index clients_status_created_idx on public.clients(status,created_at desc);
create index clients_plan_created_idx on public.clients(plan_id,created_at desc);
notify pgrst, 'reload schema';
commit;
