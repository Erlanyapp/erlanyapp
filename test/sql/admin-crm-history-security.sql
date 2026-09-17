-- Real identities; all mutations (including audit events) are rolled back.
begin;
select set_config('crm.test.admin',(select id::text from auth.users where raw_app_meta_data->>'role'='ADMIN' and lower(email)='erlanyoliveira95@gmail.com' limit 1),true);
select set_config('crm.test.client',(select u.id::text from auth.users u join public.clients c on c.user_id=u.id where coalesce(u.raw_app_meta_data->>'role','CLIENT')<>'ADMIN' limit 1),true);
do $$ begin
  if nullif(current_setting('crm.test.admin'),'') is null or nullif(current_setting('crm.test.client'),'') is null then raise exception 'Real ADMIN/CLIENT required'; end if;
  if has_function_privilege('anon','private.capture_client_crm_event()','EXECUTE') or has_function_privilege('authenticated','private.capture_client_crm_event()','EXECUTE') then raise exception 'Internal audit function exposed'; end if;
  if has_function_privilege('authenticated','private.audit_created_client(uuid)','EXECUTE') then raise exception 'Creation audit helper exposed'; end if;
  if exists(select 1 from auth.users u join public.clients c on c.user_id=u.id join auth.users a on a.id::text=u.raw_app_meta_data->>'crm_created_by'
    where u.raw_app_meta_data->>'role'='CLIENT' and a.raw_app_meta_data->>'role'='ADMIN' and lower(a.email)='erlanyoliveira95@gmail.com'
    and (select count(*) from public.audit_logs where entity='clients' and entity_id=c.id and action='client_created')<>1) then raise exception 'Real creation audit missing or duplicated'; end if;
end $$;
-- Exercise actual Auth metadata trigger and helper twice, then verify exactly one event.
do $$ declare target uuid; previous jsonb; begin
  select id,raw_app_meta_data into target,previous from auth.users where raw_app_meta_data ? 'crm_created_by' limit 1;
  if target is not null then
    update auth.users set raw_app_meta_data=raw_app_meta_data-'crm_created_by' where id=target;
    update auth.users set raw_app_meta_data=previous where id=target;
    perform private.audit_created_client(target);
    if (select count(*) from public.audit_logs where entity='clients' and entity_id=(select id from public.clients where user_id=target) and action='client_created')<>1 then raise exception 'Creation idempotency failed'; end if;
  end if;
end $$;
select set_config('request.jwt.claims',json_build_object('sub',current_setting('crm.test.admin'),'role','authenticated','app_metadata',json_build_object('role','ADMIN'))::text,true);
set local role authenticated;
do $$ declare target uuid; previous_count integer; denied boolean; begin
  select id into target from public.clients where user_id=current_setting('crm.test.client')::uuid;
  select count(*) into previous_count from public.audit_logs where entity='clients' and entity_id=target;
  update public.profiles set full_name=coalesce(full_name,'')||' [rollback audit test]' where id=current_setting('crm.test.client')::uuid;
  if (select count(*) from public.audit_logs where entity='clients' and entity_id=target)<>previous_count+1 then raise exception 'Profile audit missing'; end if;
  update public.clients set status=case status when 'active' then 'inactive' else 'active' end where id=target;
  if (select count(*) from public.audit_logs where entity='clients' and entity_id=target)<>previous_count+2 then raise exception 'Status audit missing'; end if;
  if not exists(select 1 from public.audit_logs where entity_id=target and admin_id=auth.uid() and action='client_status_changed') then raise exception 'Wrong audit actor'; end if;
  if exists(select 1 from public.audit_logs where entity_id=target and (new_value ? 'password' or new_value ? 'email' or new_value ? 'avatar_url')) then raise exception 'Audit contains prohibited fields'; end if;
  denied=false;
  begin insert into public.audit_logs(admin_id,action,entity,entity_id) values(auth.uid(),'forged','clients',target); exception when insufficient_privilege then denied=true; end;
  if not denied then raise exception 'ADMIN can forge history'; end if;
  denied=false;
  begin update public.audit_logs set action='forged' where entity_id=target; exception when insufficient_privilege then denied=true; end;
  if not denied then raise exception 'ADMIN can overwrite history'; end if;
  denied=false;
  begin delete from public.audit_logs where entity_id=target; exception when insufficient_privilege then denied=true; end;
  if not denied then raise exception 'ADMIN can erase history'; end if;
end $$;
reset role;
select set_config('request.jwt.claims',json_build_object('sub',current_setting('crm.test.client'),'role','authenticated','app_metadata',json_build_object('role','CLIENT'),'user_metadata',json_build_object('role','ADMIN'))::text,true);
set local role authenticated;
do $$ begin
  if exists(select 1 from public.audit_logs) then raise exception 'CLIENT sees administrative history'; end if;
  if exists(select 1 from public.media_assets where scope='CLIENT' and not exists(select 1 from public.clients where id=media_assets.client_id and user_id=auth.uid())) then raise exception 'Foreign media visible'; end if;
  if exists(select 1 from public.workouts where scope='CLIENT' and not exists(select 1 from public.clients where id=workouts.client_id and user_id=auth.uid())) then raise exception 'Foreign workout visible'; end if;
  if exists(select 1 from public.nutrition_plans where scope='CLIENT' and not exists(select 1 from public.clients where id=nutrition_plans.client_id and user_id=auth.uid())) then raise exception 'Foreign nutrition visible'; end if;
end $$;
reset role;
select set_config('request.jwt.claims','{}',true);
set local role anon;
do $$ declare denied boolean:=false; begin
  begin perform id from public.audit_logs limit 1; exception when insufficient_privilege then denied=true; end;
  if not denied then raise exception 'Anonymous audit access granted'; end if;
end $$;
reset role;
rollback;
select 'PASS: real ADMIN profile/status audit; immutable history; CLIENT/anon history denial; client-specific isolation; all writes rolled back' as security_result;
