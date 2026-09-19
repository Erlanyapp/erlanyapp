create table public.workout_checkins (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  workout_id uuid not null references public.workouts(id) on delete cascade,
  assignment_id uuid not null references public.workout_assignments(id) on delete cascade,
  completed_date date not null default ((now() at time zone 'America/Sao_Paulo')::date),
  completed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (client_id, assignment_id, completed_date)
);

create index workout_checkins_client_date_idx on public.workout_checkins (client_id, completed_date desc);
alter table public.workout_checkins enable row level security;

create policy "client reads own workout checkins" on public.workout_checkins for select to authenticated using (
  client_id in (select id from public.clients where user_id = (select auth.uid()))
  or (select auth.jwt() -> 'app_metadata' ->> 'role') = 'ADMIN'
);

create policy "client creates own valid workout checkin" on public.workout_checkins for insert to authenticated with check (
  completed_date = (now() at time zone 'America/Sao_Paulo')::date
  and client_id in (select id from public.clients where user_id = (select auth.uid()))
  and exists (
    select 1 from public.workout_assignments assignment
    join public.workout_assignment_schedule schedule on schedule.assignment_id = assignment.id
    where assignment.id = assignment_id and assignment.client_id = client_id
      and assignment.workout_id = workout_id and assignment.is_active
      and assignment.starts_on <= (now() at time zone 'America/Sao_Paulo')::date
      and (assignment.ends_on is null or assignment.ends_on >= (now() at time zone 'America/Sao_Paulo')::date)
      and schedule.schedule_kind = 'WORKOUT'
      and schedule.weekday = extract(isodow from now() at time zone 'America/Sao_Paulo')::smallint - 1
  )
);
