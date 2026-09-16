-- Preserve ADMIN permissions, but do not release drafts through the client API.
create policy "client released workouts only" on public.workouts as restrictive for select to authenticated
  using ((select auth.jwt()->'app_metadata'->>'role') = 'ADMIN' or (is_active and status = 'published'));
