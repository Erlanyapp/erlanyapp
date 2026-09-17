alter table public.workout_exercises add column if not exists duration_seconds integer check (duration_seconds is null or duration_seconds > 0);

create table public.workout_assignments (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  workout_id uuid not null references public.workouts(id) on delete restrict,
  starts_on date not null default current_date,
  ends_on date,
  is_active boolean not null default true,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint workout_assignments_dates check (ends_on is null or ends_on >= starts_on)
);

create table public.workout_assignment_schedule (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.workout_assignments(id) on delete cascade,
  weekday smallint not null check (weekday between 0 and 6),
  schedule_kind text not null default 'WORKOUT' check (schedule_kind in ('WORKOUT','REST')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (assignment_id, weekday)
);

create index workout_assignments_client_active_idx on public.workout_assignments(client_id,is_active,starts_on,ends_on);
create index workout_assignments_workout_idx on public.workout_assignments(workout_id);
create index workout_assignment_schedule_assignment_idx on public.workout_assignment_schedule(assignment_id,weekday);
create index workout_exercises_workout_position_idx on public.workout_exercises(workout_id,position);

create trigger workout_assignments_updated_at before update on public.workout_assignments for each row execute procedure public.set_updated_at();
create trigger workout_assignment_schedule_updated_at before update on public.workout_assignment_schedule for each row execute procedure public.set_updated_at();

alter table public.workout_assignments enable row level security;
alter table public.workout_assignment_schedule enable row level security;

create policy "admin full access workout assignments" on public.workout_assignments for all to authenticated using ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'ADMIN') with check ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'ADMIN');
create policy "admin full access workout assignment schedule" on public.workout_assignment_schedule for all to authenticated using ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'ADMIN') with check ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'ADMIN');
create policy "clients read own workout assignments" on public.workout_assignments for select to authenticated using (client_id in (select id from public.clients where user_id = (select auth.uid())));
create policy "clients read own workout assignment schedule" on public.workout_assignment_schedule for select to authenticated using (assignment_id in (select id from public.workout_assignments where client_id in (select id from public.clients where user_id = (select auth.uid()))));
