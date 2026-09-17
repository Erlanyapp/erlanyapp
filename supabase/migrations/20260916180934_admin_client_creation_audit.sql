begin;
-- Auth may persist managed app_metadata after the initial users INSERT transaction.
-- Exactly one grounded creation event, whether metadata is present on INSERT or UPDATE.
create unique index audit_client_creation_once_idx on public.audit_logs(entity_id)
where entity='clients' and action='client_created';

create function private.audit_created_client(target_user_id uuid) returns void language plpgsql
security definer set search_path = '' as $$
begin
  insert into public.audit_logs(admin_id,action,entity,entity_id,new_value,created_at)
  select actor.id,'client_created','clients',c.id,jsonb_build_object('status',c.status),c.created_at
  from auth.users u join public.clients c on c.user_id=u.id
  join auth.users actor on actor.id::text=u.raw_app_meta_data->>'crm_created_by'
  where u.id=target_user_id and u.raw_app_meta_data->>'role'='CLIENT'
    and actor.raw_app_meta_data->>'role'='ADMIN' and lower(actor.email)='erlanyoliveira95@gmail.com'
  on conflict (entity_id) where entity='clients' and action='client_created' do nothing;
end; $$;
revoke all on function private.audit_created_client(uuid) from public,anon,authenticated;

create function private.capture_auth_client_creation() returns trigger language plpgsql
security definer set search_path = '' as $$
begin
  if new.raw_app_meta_data->>'crm_created_by' is distinct from old.raw_app_meta_data->>'crm_created_by'
    or new.raw_app_meta_data->>'role' is distinct from old.raw_app_meta_data->>'role' then
    perform private.audit_created_client(new.id);
  end if;
  return new;
end; $$;
revoke all on function private.capture_auth_client_creation() from public,anon,authenticated;
create trigger auth_client_crm_creation after update of raw_app_meta_data on auth.users
for each row execute function private.capture_auth_client_creation();

-- Repair only actual creations proven by trusted server-managed creator metadata.
-- No invented events for pre-existing users lacking that evidence.
do $$ declare item record; begin
  for item in select id from auth.users where raw_app_meta_data ? 'crm_created_by' loop
    perform private.audit_created_client(item.id);
  end loop;
end; $$;
notify pgrst, 'reload schema';
commit;
