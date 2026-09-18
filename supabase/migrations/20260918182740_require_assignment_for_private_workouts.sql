-- Published GLOBAL workouts are public client content. Every CLIENT workout,
-- including a published one, remains private until its own active assignment
-- schedules it for the authenticated client.
drop policy if exists "client released workouts only" on public.workouts;

create policy "client released workouts only" on public.workouts
  as restrictive
  for select
  to authenticated
  using (
    (select auth.jwt() -> 'app_metadata' ->> 'role') = 'ADMIN'
    or (
      is_active
      and (
        (status = 'published' and scope = 'GLOBAL')
        or exists (
          select 1
          from public.workout_assignments assignment
          join public.clients client on client.id = assignment.client_id
          join public.workout_assignment_schedule schedule on schedule.assignment_id = assignment.id
          where assignment.workout_id = workouts.id
            and assignment.is_active
            and assignment.starts_on <= (now() at time zone 'America/Sao_Paulo')::date
            and (assignment.ends_on is null or assignment.ends_on >= (now() at time zone 'America/Sao_Paulo')::date)
            and schedule.schedule_kind = 'WORKOUT'
            and schedule.weekday = extract(isodow from now() at time zone 'America/Sao_Paulo')::smallint - 1
            and client.user_id = (select auth.uid())
        )
      )
    )
  );

drop policy if exists "workout exercises accessible workout read" on public.workout_exercises;

create policy "workout exercises accessible workout read" on public.workout_exercises
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.workouts workout
      where workout.id = workout_exercises.workout_id
        and workout.is_active
        and (
          (workout.status = 'published' and workout.scope = 'GLOBAL')
          or exists (
            select 1
            from public.workout_assignments assignment
            join public.clients client on client.id = assignment.client_id
            join public.workout_assignment_schedule schedule on schedule.assignment_id = assignment.id
            where assignment.workout_id = workout.id
              and assignment.is_active
              and assignment.starts_on <= (now() at time zone 'America/Sao_Paulo')::date
              and (assignment.ends_on is null or assignment.ends_on >= (now() at time zone 'America/Sao_Paulo')::date)
              and schedule.schedule_kind = 'WORKOUT'
              and schedule.weekday = extract(isodow from now() at time zone 'America/Sao_Paulo')::smallint - 1
              and client.user_id = (select auth.uid())
          )
        )
    )
  );
