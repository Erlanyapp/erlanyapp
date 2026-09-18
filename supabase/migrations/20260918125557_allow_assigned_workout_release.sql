-- An active, in-period assignment is an explicit release of a workout to its
-- owner. Drafts without an assignment remain unavailable to clients.
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
        status = 'published'
        or exists (
          select 1
          from public.workout_assignments assignment
          join public.clients client on client.id = assignment.client_id
          where assignment.workout_id = workouts.id
            and assignment.is_active
            and assignment.starts_on <= current_date
            and (assignment.ends_on is null or assignment.ends_on >= current_date)
            and client.user_id = (select auth.uid())
        )
      )
    )
  );

-- Exercise prescriptions follow the same release boundary as their workout.
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
          (workout.status = 'published' and (
            workout.scope = 'GLOBAL'
            or workout.client_id in (
              select id from public.clients where user_id = (select auth.uid())
            )
          ))
          or exists (
            select 1
            from public.workout_assignments assignment
            join public.clients client on client.id = assignment.client_id
            where assignment.workout_id = workout.id
              and assignment.is_active
              and assignment.starts_on <= current_date
              and (assignment.ends_on is null or assignment.ends_on >= current_date)
              and client.user_id = (select auth.uid())
          )
        )
    )
  );
