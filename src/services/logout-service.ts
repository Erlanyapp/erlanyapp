import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
export async function logoutClient() {
  const { error } = await createSupabaseBrowserClient().auth.signOut({ scope: "local" });
  if (error) throw error;
}
