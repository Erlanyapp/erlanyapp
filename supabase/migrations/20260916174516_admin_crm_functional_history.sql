begin;

-- Reuse audit_logs. Browser/API sessions may read ADMIN history, never forge or erase it.
revoke all on public.audit_logs from public, anon, authenticated;
grant select on public.audit_logs to authenticated;
drop policy "admin full access audit_logs" on public.audit_logs;
create policy "admin audit read" on public.audit_logs for select to authenticated
using ((select auth.jwt()->'app_metadata'->>'role') = 'ADMIN');
create index audit_client_history_idx on public.audit_logs(entity,entity_id,created_at desc,id desc);

-- Internal trigger only: minimal audited fields, no passwords/email/photos/JWTs.
create function private.capture_client_crm_event() returns trigger language plpgsql
security definer set search_path = '' as $$
declare actor uuid; target uuid; event text; before_value jsonb; after_value jsonb; creator text;
begin
  if tg_table_name = 'clients' and tg_op = 'INSERT' then
    select raw_app_meta_data->>'crm_created_by' into creator from auth.users where id = new.user_id;
    if creator is null or creator !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then return new; end if;
    actor := creator::uuid; target := new.id; event := 'client_created';
    after_value := jsonb_build_object('status',new.status);
  else
    if coalesce(auth.jwt()->'app_metadata'->>'role','') <> 'ADMIN' then return new; end if;
    actor := auth.uid();
    if tg_table_name = 'profiles' then
      if new.full_name is not distinct from old.full_name then return new; end if;
      select id into target from public.clients where user_id = new.id;
      event := 'profile_updated'; before_value := jsonb_build_object('full_name',old.full_name);
      after_value := jsonb_build_object('full_name',new.full_name);
    else
      if new.status is not distinct from old.status then return new; end if;
      target := new.id; event := 'client_status_changed';
      before_value := jsonb_build_object('status',old.status); after_value := jsonb_build_object('status',new.status);
    end if;
  end if;
  -- Re-check persisted managed role: stale claims do not create a false actor attribution.
  if target is not null and exists (select 1 from auth.users where id = actor
    and raw_app_meta_data->>'role' = 'ADMIN' and lower(email) = 'erlanyoliveira95@gmail.com') then
    insert into public.audit_logs(admin_id,action,entity,entity_id,old_value,new_value)
    values(actor,event,'clients',target,before_value,after_value);
  end if;
  return new;
end; $$;
revoke all on function private.capture_client_crm_event() from public,anon,authenticated;
create trigger clients_crm_created after insert on public.clients
for each row execute function private.capture_client_crm_event();
create trigger clients_crm_status after update of status on public.clients
for each row execute function private.capture_client_crm_event();
create trigger profiles_crm_updated after update of full_name on public.profiles
for each row execute function private.capture_client_crm_event();

-- Client-specific readers are bounded and indexed; no new parallel entities.
create index workouts_client_updated_idx on public.workouts(client_id,updated_at desc,id desc) where scope = 'CLIENT';
create index nutrition_client_updated_idx on public.nutrition_plans(client_id,updated_at desc,id desc) where scope = 'CLIENT';
create index media_client_created_idx on public.media_assets(client_id,created_at desc,id desc) where scope = 'CLIENT';
notify pgrst, 'reload schema';
commit;
