-- Real production identities, no synthetic accounts. Every write is rolled back.
begin;
select set_config('crm.test.admin', (select id::text from auth.users where raw_app_meta_data->>'role'='ADMIN' limit 1), true);
select set_config('crm.test.client', (select u.id::text from auth.users u join public.clients c on c.user_id=u.id where coalesce(u.raw_app_meta_data->>'role','CLIENT')<>'ADMIN' limit 1), true);
do $$ begin
  if nullif(current_setting('crm.test.admin'),'') is null or nullif(current_setting('crm.test.client'),'') is null then
    raise exception 'Real ADMIN and CLIENT identities required';
  end if;
  if exists(select 1 from public.profiles p join auth.users u on u.id=p.id where p.email is distinct from u.email) then
    raise exception 'Auth email backfill mismatch';
  end if;
  -- Exercise the actual email update trigger without changing any email.
  update auth.users set email=email where id=current_setting('crm.test.client')::uuid;
  if not exists(select 1 from public.profiles p join auth.users u on u.id=p.id where p.id=current_setting('crm.test.client')::uuid and p.email=u.email) then
    raise exception 'Auth email synchronization failed';
  end if;
  if has_function_privilege('anon','private.sync_profile_email()','EXECUTE') or has_function_privilege('authenticated','private.sync_profile_email()','EXECUTE') then
    raise exception 'Internal email trigger exposed';
  end if;
end $$;
select set_config('request.jwt.claims', json_build_object('sub',current_setting('crm.test.client'),'role','authenticated','app_metadata',json_build_object('role','CLIENT'),'user_metadata',json_build_object('role','ADMIN'))::text,true);
set local role authenticated;
do $$ declare affected integer; denied boolean; begin
  if (select count(*) from public.profiles)<>1 or (select count(*) from public.clients)<>1 then raise exception 'CLIENT identity isolation failed'; end if;
  if exists(select 1 from public.clients where user_id<>auth.uid()) then raise exception 'Foreign clients visible'; end if;
  if exists(select 1 from public.progress_weights w where not exists(select 1 from public.clients c where c.id=w.client_id and c.user_id=auth.uid())) then raise exception 'Foreign progress visible'; end if;
  update public.profiles set full_name=full_name where id=current_setting('crm.test.admin')::uuid;
  get diagnostics affected=row_count;
  if affected<>0 then raise exception 'CLIENT can edit foreign profile'; end if;
  update public.profiles set full_name=full_name where id=auth.uid();
  get diagnostics affected=row_count;
  if affected<>1 then raise exception 'Own profile edit regressed'; end if;
  denied=false;
  begin update public.profiles set role='ADMIN' where id=auth.uid(); exception when others then
    if sqlerrm='Profile identity and role cannot be changed by clients' then denied=true; else raise; end if;
  end;
  if not denied then raise exception 'CLIENT role escalation accepted'; end if;
  denied=false;
  begin update public.profiles set email=email||'.invalid' where id=auth.uid(); exception when others then
    if sqlerrm='Email is managed by Auth' then denied=true; else raise; end if;
  end;
  if not denied then raise exception 'Auth email editable by CLIENT'; end if;
  denied=false;
  begin update public.clients set status=case status when 'active' then 'inactive' else 'active' end where user_id=auth.uid(); exception when others then
    if sqlerrm='Client management requires ADMIN' then denied=true; else raise; end if;
  end;
  if not denied then raise exception 'CLIENT can manage status'; end if;
  denied=false;
  begin update public.clients set plan_id=(select id from public.plans where id is distinct from public.clients.plan_id limit 1) where user_id=auth.uid(); exception when others then
    if sqlerrm='Client management requires ADMIN' then denied=true; else raise; end if;
  end;
  if not denied then raise exception 'CLIENT can change plan'; end if;
  if exists(select 1 from storage.objects where bucket_id='images' and (storage.foldername(name))[1]='avatars' and (storage.foldername(name))[2]<>auth.uid()::text) then raise exception 'Foreign avatar visible to CLIENT'; end if;
end $$;
reset role;
select set_config('request.jwt.claims',json_build_object('sub',current_setting('crm.test.admin'),'role','authenticated','app_metadata',json_build_object('role','ADMIN'))::text,true);
set local role authenticated;
do $$ declare affected integer; denied boolean; begin
  if (select count(*) from public.clients)<2 or (select count(*) from public.profiles)<2 then raise exception 'ADMIN cannot read real client profiles'; end if;
  update public.profiles set full_name=full_name where id=current_setting('crm.test.client')::uuid;
  get diagnostics affected=row_count;
  if affected<>1 then raise exception 'ADMIN profile edit denied'; end if;
  update public.clients set status=case status when 'active' then 'inactive' else 'active' end where user_id=current_setting('crm.test.client')::uuid;
  get diagnostics affected=row_count;
  if affected<>1 then raise exception 'ADMIN status management denied'; end if;
  denied=false;
  begin update public.profiles set email=email||'.invalid' where id=current_setting('crm.test.client')::uuid; exception when others then
    if sqlerrm='Email is managed by Auth' then denied=true; else raise; end if;
  end;
  if not denied then raise exception 'Auth email editable by ADMIN'; end if;
  if not exists(select 1 from storage.objects where bucket_id='images' and (storage.foldername(name))[1]='avatars' and (storage.foldername(name))[2]=current_setting('crm.test.client')) then raise exception 'Real client avatar cannot be read by ADMIN'; end if;
  update storage.objects set name=name where bucket_id='images' and (storage.foldername(name))[1]='avatars' and (storage.foldername(name))[2]=current_setting('crm.test.client');
  get diagnostics affected=row_count;
  if affected<>0 then raise exception 'ADMIN can overwrite foreign avatar'; end if;
end $$;
reset role;
select set_config('request.jwt.claims','{}',true);
set local role anon;
do $$ begin
  if exists(select 1 from public.clients) or exists(select 1 from public.profiles) then raise exception 'Anonymous CRM data visible'; end if;
end $$;
reset role;
rollback;
select 'PASS: CLIENT isolation/escalation/email/status/plan, ADMIN read/edit/status/avatar read-only, anonymous denial, Auth sync; all writes rolled back' as security_result;
