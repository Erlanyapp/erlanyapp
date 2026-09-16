# Architecture

```text
UI (Next.js App Router)
  → application services (`src/services`)
  → domain types/features (`src/features`, `src/types`)
  → repositories/infrastructure (`src/lib`)
  → Supabase Auth, PostgreSQL, Storage and external providers
```

Client routes live under `src/app/(client)` and auth routes under `src/app/(auth)`; administration lives under `src/app/(admin)/admin`. Provider-specific video/payment implementations must be replaceable through interfaces. Server-side validation and authorization remain required even when a route is protected in the UI.

Content reads and future admin use cases go through `src/services/content-service.ts` and the `ContentRepository` boundary in `src/repositories/content-repository.ts`. Provider-specific video behavior lives behind `VideoProviderAdapter` in `src/lib/content/video-provider.ts`; YouTube is only the initial adapter. Scope filtering is enforced by Supabase RLS in addition to application services.

Client account reads use `server-account.ts` → `account-service.ts` → `account-repository.ts`. The client layout verifies the Auth user server-side. Server Actions obtain ownership from the verified session, never hidden fields, and perform validation/upload/persistence through the service boundary. FormData/photo bytes cross the server boundary but go only to Storage; PostgreSQL receives profile metadata/object paths.

URL-based tabs/filters are semantic links and GET forms, preserving browser back/forward and direct navigation. Exercise videos resolve their internal FK to a video record before invoking its provider adapter. Logout uses the existing browser SSR client through an application service, preserving cookie cleanup and redirecting only after success. Splash and administrative routes were not rebuilt.
