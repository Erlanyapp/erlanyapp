# Database

The official project reference is `wifnkpezifxoqfqvgjmj`. The Phase 0 schema is in `supabase/migrations/20260915141400_phase_0_foundation.sql`.

All public tables have RLS enabled. Client ownership is resolved through `clients.user_id`. Global/client content uses `scope`; `CLIENT` rows require `client_id`. Admin policies use the managed JWT `app_metadata.role` claim and never editable `user_metadata`.

Large files belong in Supabase Storage under logical image/client/global/progress paths. Video records store provider metadata (`provider`, `provider_video_id`, title, thumbnail, duration, type, scope and client ownership); the UI must not expose provider URLs or interfaces.

## Content foundation

Migration `20260915223812_content_foundation.sql` evolves the existing Phase 0 tables without deleting data. It adds stable slugs and active flags for exercises, workouts, tips and recipes; provider validation for videos; typed media metadata; and normalized `nutrition_meals` and `recipe_ingredients` tables. `media_assets` references Supabase Storage objects; binary photos are never stored in PostgreSQL.

All content tables have RLS. Authenticated clients can read only `GLOBAL` rows or rows whose `client_id` resolves through their own `clients.user_id`. Admin management policies use the server-managed `app_metadata.role` claim, never editable `user_metadata`. Workout exercise and recipe ingredient reads inherit access from their parent content row. The `images` Storage bucket is private and follows the same global/client ownership rules.
