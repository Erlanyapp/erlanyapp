import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function requireAdmin() {
  const client = await createSupabaseServerClient();
  if (!client) redirect("/login");
  const { data: { user } } = await client.auth.getUser();
  if (!user) redirect("/login");
  if (user.app_metadata?.role !== "ADMIN") redirect("/app/inicio");
  return { client, user };
}
