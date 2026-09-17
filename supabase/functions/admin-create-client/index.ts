import { createClient } from "npm:@supabase/supabase-js@2.57.0";
import { registrationHandler } from "./handler.ts";

const url = Deno.env.get("SUPABASE_URL")!;
const options = { auth: { persistSession: false, autoRefreshToken: false } };
Deno.serve(registrationHandler({
  viewer: () => createClient(url, Deno.env.get("SUPABASE_ANON_KEY")!, options),
  // Built-in hosted secret, never provisioned into Next.js/Vercel or sent to the browser.
  administrator: () => createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, options),
}));
