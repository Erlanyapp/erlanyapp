# Client functional audit — 2026-09-16

Scope: connect client interactions to real routes and persisted data. Splash and
Admin screens were preserved. Phase 4.2 was not started.

## Interaction map

| Entry | Real destination or operation |
| --- | --- |
| Bottom navigation | `/app/inicio`, `/app/treinos`, `/app/evolucao`, `/app/dicas`, `/app/mais` |
| Home shortcuts | Evolution, nutrition and tips routes |
| Avatar / Meus dados / Ver meu perfil | `/app/perfil` |
| Editar perfil | `/app/perfil/editar`; authenticated name and private avatar save |
| Meus treinos | `/app/treinos?tab=Meus+treinos`; assigned, published workouts only |
| Workout and exercise cards | Real ID detail routes, parent-aware return and provider video metadata |
| Evolution tabs | Separate owned weight, measurement, photo and performance queries |
| Registrar peso | Validated server action into existing `progress_weights` |
| Nutrition tabs | Actual plans/meals, recipe details and available guidance |
| Tips tabs/cards | Categories from existing content and real detail routes |
| Plan CTAs | Real database plan details; contact link, no simulated checkout |
| Conquistas / Notificações | Owned database records or explicit empty state |
| Falar com a Erlany | Persisted support messages and history; not realtime chat |
| Central de ajuda | Expandable guidance and working contextual links |
| Configurações | Account link, honest preference availability and logout |
| Sair | Supabase local session sign-out, login redirect and router refresh |

Async forms expose pending, error and success states. Read failures are distinct
from empty results and provide retry controls. Tabs and filters use navigable URL
parameters. No fabricated workout, achievement, notification or payment was added.

## Security and database

The existing official project `wifnkpezifxoqfqvgjmj`, private `images` bucket,
profile column and application tables were reused. Applied migrations:

- `20260916122122_client_functional_interactions.sql`
- `20260916125441_client_workout_release_access.sql`

Client identity comes from verified Auth, never editable form fields. Content
queries explicitly constrain GLOBAL or the authenticated CLIENT; progress reads
resolve ownership through `clients.user_id`, including Admin visits to the client
shell. Published/active workout access is also enforced by restrictive RLS.

Avatar objects use `avatars/<auth-user-id>/<uuid>.<extension>`. File size, MIME and
signature are checked on the server. PostgreSQL stores only the object path;
short-lived signed URLs are generated only for owned avatars. Restrictive Storage
RLS prevents even another authenticated Admin from accessing foreign avatars.
Client profile updates cannot elevate role. Previous avatars are retained; a
failed profile save cleans up only its newly uploaded orphan.

Real transactional SQL checks passed for owned avatar access, foreign access and
write rejection, role elevation rejection, owned weight insertion, and draft /
published / inactive workout boundaries. Test rows were rolled back. Direct SQL
Storage deletion hit Supabase's native delete guard; Storage API deletion was not
tested. One existing ADMIN was preserved; default role remains CLIENT, the Auth
user trigger exists, and the reused bucket remains private.

## Verification evidence

- Real authenticated browser navigation: Home shortcuts, all Mais entries,
  tabs, workout search, real plan details/contact CTA, expandable help and profile.
- The owner selected and saved a real profile photo. Success feedback, the private
  Storage object, saved profile path and loaded Home avatar were confirmed.
- Logout returned to `/login`; navigating to the profile without a session also
  returned to login.
- 210 page/viewport layout checks across 14 client pages, with effective browser
  dimensions verified: 320×568, 360×800, 375×812, 390×844, 393×852, 412×915,
  430×932, 480×960, 768×1024, 820×1180, 1024×1366, 1280×720, 1366×768,
  1440×900 and 1920×1080. No page overflow or inaccessible bottom controls found.
  Safe-area CSS and navigation clearance were inspected; physical notch insets
  were not emulated.
- `npm run typecheck`: exit 0.
- `npm run lint`: exit 0; no rules disabled.
- `npm test`: 15 passed, zero failures.
- `npm run build`: exit 0. Existing Supabase dependency Edge API compatibility
  warnings and webpack cache serialization warnings remain; they were not hidden.

## Explicit limits

The official database currently has no workouts, exercises, videos, tips, recipes,
nutrition plans or progress photos. Their populated detail/playback flows could
not be exercised end-to-end in the browser; adapter, repository and ownership
boundaries have automated coverage. No fake production data was seeded.

New signup, confirmation email, password-reset email and OAuth flows were not
submitted during this audit. Actual weight and contact writes were not submitted
through the UI to avoid inventing health records or sending a test message to the
owner; service validation and transactional weight insertion were tested.

Evolution photo upload, checkout, realtime chat, email changes and customizable
preferences remain unavailable and are explicitly presented as such, without
inactive controls pretending to implement them. Deployment evidence is supplied
in the final delivery report after the real production deployment completes.
