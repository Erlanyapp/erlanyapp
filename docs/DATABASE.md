# Database

The official project reference is `wifnkpezifxoqfqvgjmj`. The Phase 0 schema is in `supabase/migrations/20260915141400_phase_0_foundation.sql`.

All public tables have RLS enabled. Client ownership is resolved through `clients.user_id`. Global/client content uses `scope`; `CLIENT` rows require `client_id`. Admin policies use the managed JWT `app_metadata.role` claim and never editable `user_metadata`.

Large files belong in Supabase Storage under logical image/client/global/progress paths. Video records store provider metadata (`provider`, `provider_video_id`, title, thumbnail, duration, type, scope and client ownership); the UI must not expose provider URLs or interfaces.
