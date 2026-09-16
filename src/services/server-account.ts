import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createAccountRepository } from "@/repositories/account-repository";
import { createAccountService } from "@/services/account-service";

export const getClientAccount = cache(async () => {
  const client = await createSupabaseServerClient();
  if (!client) throw new Error("Supabase não está configurado neste ambiente.");
  const { data, error } = await client.auth.getUser();
  if (!data.user) redirect("/login");
  if (error) throw error;
  const service = createAccountService(createAccountRepository(client));
  return { account: await service.account(data.user), service };
});
