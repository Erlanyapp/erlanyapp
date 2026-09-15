# Architecture

```text
UI (Next.js App Router)
  → application services (`src/services`)
  → domain types/features (`src/features`, `src/types`)
  → repositories/infrastructure (`src/lib`)
  → Supabase Auth, PostgreSQL, Storage and external providers
```

Client routes will live under `src/app/(client)` and auth routes under `src/app/(auth)`; administration will live under `src/app/admin`. Provider-specific video/payment implementations must be replaceable through interfaces. Server-side validation and authorization remain required even when a route is protected in the UI.

Content reads and future admin use cases go through `src/services/content-service.ts` and the `ContentRepository` boundary in `src/repositories/content-repository.ts`. Provider-specific video behavior lives behind `VideoProviderAdapter` in `src/lib/content/video-provider.ts`; YouTube is only the initial adapter. Scope filtering is enforced by Supabase RLS in addition to application services.
