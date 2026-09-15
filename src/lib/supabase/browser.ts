import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseEnv } from "@/lib/supabase/env";

let browserClient: ReturnType<typeof createBrowserClient> | undefined;

export function createSupabaseBrowserClient() {
  if (browserClient) return browserClient;
  const config = getSupabaseEnv();
  if (!config) throw new Error("Supabase não está configurado neste ambiente.");
  browserClient = createBrowserClient(config.url, config.key);
  return browserClient;
}
