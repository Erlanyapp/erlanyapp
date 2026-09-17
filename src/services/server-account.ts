import "server-only";
import { cache } from "react";
import { getClientIdentity, getOwnClientId } from "@/services/server-client-context";
import { createAccountRepository } from "@/repositories/account-repository";
import { createAccountService } from "@/services/account-service";

export const getClientAccount = cache(async () => {
  const identity = await getClientIdentity();
  if (!identity) throw new Error("Supabase não está configurado neste ambiente.");
  const service = createAccountService(createAccountRepository(identity.client, getOwnClientId));
  return { account: await service.account(identity.user), service };
});
