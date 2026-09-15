# ERLANY FIT — Product specification

Slogan: **Seu corpo, seu cuidado, sua evolução**.

ERLANY FIT provides personalized and global workouts, exercises, videos, evolution tracking, nutrition, tips, massage therapy, subscriptions, notifications, support and an administration CMS. Roles are `ADMIN` (one administrator) and `CLIENT`.

Phase 0 establishes architecture, tokens, reusable components, Supabase schema/security, auth boundaries and documentation. The ten reference screens are intentionally deferred to Phase 1.

## Content foundation (Phase 3.1)

Content entities support `GLOBAL` records visible to every authenticated client and `CLIENT` records visible only to the owning client. Exercises, workouts, videos, tips, nutrition plans, recipes and media assets use this model. YouTube is the initial video provider through an adapter boundary; the client renders ERLANY FIT video experiences rather than provider pages or URLs. Photos are stored in Supabase Storage and PostgreSQL stores only their metadata and object path. Checkout, subscriptions, massotherapy, realtime chat and the administrative CMS remain out of scope for this phase.
