-- One evolving initial profile per client. Progress history remains independent.
create table if not exists public.client_initial_intakes (
  client_id uuid primary key references public.clients(id) on delete cascade,
  birth_date date, height_cm numeric(5,2), current_weight_kg numeric(6,2), target_weight_kg numeric(6,2),
  primary_goal text check (primary_goal in ('WEIGHT_LOSS','MUSCLE_GAIN','CONDITIONING','QUALITY_OF_LIFE')),
  experience_level text check (experience_level in ('BEGINNER','INTERMEDIATE','ADVANCED')),
  training_days_per_week smallint check (training_days_per_week between 1 and 7),
  training_location text check (training_location in ('GYM','HOME','BOTH')),
  session_minutes smallint check (session_minutes between 10 and 300),
  has_limitations boolean, has_professional_guidance boolean, restrictions text check (char_length(restrictions) <= 2000),
  status text not null default 'DRAFT' check (status in ('DRAFT','COMPLETED')),
  free_workout_status text not null default 'WAITING' check (free_workout_status in ('WAITING','RELEASED')),
  personalization_status text not null default 'NOT_APPLICABLE' check (personalization_status in ('NOT_APPLICABLE','WAITING_SUBSCRIPTION','WAITING_PERSONALIZATION','IN_PROGRESS','COMPLETE')),
  completed_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create trigger client_initial_intakes_updated_at before update on public.client_initial_intakes for each row execute procedure public.set_updated_at();
alter table public.client_initial_intakes enable row level security;
revoke all on public.client_initial_intakes from anon, public;
grant select, insert, update on public.client_initial_intakes to authenticated;
create policy "admin full access client initial intakes" on public.client_initial_intakes for all to authenticated using ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'ADMIN') with check ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'ADMIN');
create policy "clients manage own initial intake" on public.client_initial_intakes for all to authenticated using (client_id in (select id from public.clients where user_id = (select auth.uid()))) with check (client_id in (select id from public.clients where user_id = (select auth.uid())));
