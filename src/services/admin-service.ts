import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminRepository } from "@/repositories/admin-repository";

export function createAdminService(client: SupabaseClient) {
  const repository = createAdminRepository(client);
  return { getMetrics: () => repository.getMetrics(), listClients: (params: Parameters<typeof repository.listClients>[0]) => repository.listClients(params), getClient: (id: string) => repository.getClient(id) };
}
