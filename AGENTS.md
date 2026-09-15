# ERLANY FIT agent guidance

- Official GitHub remote: `https://github.com/Erlanyapp/erlanyapp.git`.
- Official Supabase project reference: `wifnkpezifxoqfqvgjmj`.
- Use versioned migrations under `supabase/migrations`; review the existing schema before adding tables and never reset or delete production data.
- Content must support `GLOBAL` and `CLIENT` scope. Client access is enforced by Supabase RLS and must resolve ownership through `clients.user_id`.
- Videos store provider metadata only. YouTube is the initial provider, but application code must use the provider adapter boundary.
- Photos and other large files belong in private Supabase Storage; PostgreSQL stores metadata and object paths, never blobs/base64.
- Never commit secrets, service-role keys, database passwords or tokens. Public Next.js variables may contain only publishable Supabase configuration.
- Keep the UI → services → repositories → infrastructure layering. Do not put Supabase queries directly in React components.
