# Database

The official project reference is `wifnkpezifxoqfqvgjmj`. The Phase 0 schema is in `supabase/migrations/20260915141400_phase_0_foundation.sql`.

All public tables have RLS enabled. Client ownership is resolved through `clients.user_id`. Global/client content uses `scope`; `CLIENT` rows require `client_id`. Admin policies use the managed JWT `app_metadata.role` claim and never editable `user_metadata`.

Large files belong in Supabase Storage under logical image/client/global/progress paths. Video records store provider metadata (`provider`, `provider_video_id`, title, thumbnail, duration, type, scope and client ownership); the UI must not expose provider URLs or interfaces.

## Content foundation

Migration `20260915223812_content_foundation.sql` evolves the existing Phase 0 tables without deleting data. It adds stable slugs and active flags for exercises, workouts, tips and recipes; provider validation for videos; typed media metadata; and normalized `nutrition_meals` and `recipe_ingredients` tables. `media_assets` references Supabase Storage objects; binary photos are never stored in PostgreSQL.

All content tables have RLS. Authenticated clients can read only `GLOBAL` rows or rows whose `client_id` resolves through their own `clients.user_id`. Admin management policies use the server-managed `app_metadata.role` claim, never editable `user_metadata`. Workout exercise and recipe ingredient reads inherit access from their parent content row. The `images` Storage bucket is private and follows the same global/client ownership rules.

## Client functional audit

Applied migrations: `20260916122122_client_functional_interactions.sql` and `20260916125441_client_workout_release_access.sql`.

- Reuse the **private** `images` bucket. Profile photos use `avatars/<auth-user-id>/<random-uuid>.<extension>`; the legacy `profiles.avatar_url` column stores this object **path**, not a signed URL or binary data. No new bucket/table/column was needed.
- Own-avatar permissive policies and an additional restrictive ownership boundary protect SELECT/INSERT/UPDATE/DELETE, including against the pre-existing ADMIN image policy. Other image paths retain their existing policies. Signed URLs are short-lived bearer URLs; never log, share or commit them. See [Supabase Storage access control](https://supabase.com/docs/guides/storage/security/access-control).
- Profile updates guard identity and CLIENT role against changes; authorization never trusts editable metadata. Only a server-managed ADMIN claim can authorize a role change. The existing administrator was not changed.
- Weight INSERT, performance SELECT, earned-achievement details SELECT and support-message INSERT are restricted to ownership through `clients.user_id`. Support sender must equal `auth.uid()`.
- CLIENT workout reads require `is_active = true` and `status = 'published'`. Draft/inactive access remains available to ADMIN; the client repository always filters released/owned content, even when ADMIN browses the client shell.
- Image replacements use unique filenames and preserve previous files. Failed profile persistence cleans up only the newly uploaded orphan. Future retention cleanup must be explicit, not destructive during profile editing.

## Admin CRM — Fase 4.2

Migration `20260916145818_admin_client_crm.sql` aplicada no projeto oficial: adiciona o espelho somente leitura `profiles.email`, sincronizado por triggers internos de Auth; FK `clients.user_id → profiles.id`; índices de paginação/filtros; policy ADMIN de edição de perfil e guarda de identidade/plano/status em clients. Não há novas identidades, dados fictícios, reset ou exclusão.

A boundary de avatar passou a separar leitura e escrita: ADMIN pode consultar fotos reais dos clientes; INSERT/UPDATE/DELETE de avatars continuam restritos ao proprietário, inclusive para ADMIN. E-mail não é autorização. Status ativo/inativo de clients não bloqueia Auth nem modifica assinatura. Ver [ADMIN_CRM.md](ADMIN_CRM.md) e o teste transacional `test/sql/admin-crm-security.sql`.
