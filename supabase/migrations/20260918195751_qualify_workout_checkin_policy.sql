drop policy if exists "client creates own valid workout checkin" on public.workout_checkins;

create policy "client creates own valid workout checkin" on public.workout_checkins
for insert to authenticated
with check (
  workout_checkins.completed_date = (now() at time zone 'America/Sao_Paulo')::date
  and workout_checkins.client_id in (
    select client.id from public.clients client where client.user_id = (select auth.uid())
  )
  and exists (
    select 1
    from public.workout_assignments assignment
    join public.workout_assignment_schedule schedule on schedule.assignment_id = assignment.id
    where assignment.id = workout_checkins.assignment_id
      and assignment.client_id = workout_checkins.client_id
      and assignment.workout_id = workout_checkins.workout_id
      and assignment.is_active
      and assignment.starts_on <= (now() at time zone 'America/Sao_Paulo')::date
      and (assignment.ends_on is null or assignment.ends_on >= (now() at time zone 'America/Sao_Paulo')::date)
      and schedule.schedule_kind = 'WORKOUT'
      and schedule.weekday = extract(isodow from now() at time zone 'America/Sao_Paulo')::smallint - 1
  )
);
