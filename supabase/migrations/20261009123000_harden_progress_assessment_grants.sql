-- Keep the shared authenticated role at the least privilege necessary for RLS.
-- The assessment policies still decide which authenticated users can act.
revoke all on table public.progress_assessments from authenticated;
grant select, insert, update, delete on table public.progress_assessments to authenticated;
