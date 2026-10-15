-- Narrow the project-wide default table grants for this sensitive intake only.
-- This migration deliberately does not change defaults for other tables or roles.
alter table public.client_initial_intakes enable row level security;

revoke all privileges on table public.client_initial_intakes from public, anon, authenticated;
grant select, insert, update on table public.client_initial_intakes to authenticated;

drop policy if exists "admin full access client initial intakes" on public.client_initial_intakes;
drop policy if exists "clients manage own initial intake" on public.client_initial_intakes;

create policy "admin read client initial intakes"
  on public.client_initial_intakes for select to authenticated
  using ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'ADMIN');

create policy "admin insert client initial intakes"
  on public.client_initial_intakes for insert to authenticated
  with check ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'ADMIN');

create policy "admin update client initial intakes"
  on public.client_initial_intakes for update to authenticated
  using ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'ADMIN')
  with check ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'ADMIN');

create policy "clients read own initial intake"
  on public.client_initial_intakes for select to authenticated
  using (client_id in (select id from public.clients where user_id = (select auth.uid())));

create policy "clients insert own initial intake"
  on public.client_initial_intakes for insert to authenticated
  with check (client_id in (select id from public.clients where user_id = (select auth.uid())));

create policy "clients update own initial intake"
  on public.client_initial_intakes for update to authenticated
  using (client_id in (select id from public.clients where user_id = (select auth.uid())))
  with check (client_id in (select id from public.clients where user_id = (select auth.uid())));
