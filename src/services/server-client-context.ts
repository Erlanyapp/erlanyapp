import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

// React cache is scoped to this server render, never shared between sessions.
export const getClientIdentity = cache(async () => {
  const client = await createSupabaseServerClient();
  if (!client) return null;
  const { data, error } = await client.auth.getUser();
  if (!data.user) redirect("/login");
  if (error) throw error;
  return { client, user: data.user };
});

export const getOwnClientId = cache(async () => {
  const identity = await getClientIdentity();
  if (!identity) throw new Error("Supabase não está configurado neste ambiente.");
  const { data, error } = await identity.client.from("clients").select("id").eq("user_id", identity.user.id).single();
  if (error) throw error;
  return data.id as string;
});
