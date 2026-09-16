import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminRepository } from "@/repositories/admin-repository";
import { adminClientId,clientListFilters,nextClientStatus,profileEdit,type AdminSearchParams } from "@/domain/admin-client";
export function createAdminService(client:SupabaseClient) {
  const r=createAdminRepository(client);
  return {getMetrics:r.getMetrics,plans:r.plans,getAdministrator:r.getAdministrator,
    listClients:(params:AdminSearchParams)=>r.listClients(clientListFilters(params)),getClient:(id:string)=>r.getClient(adminClientId(id)),
    async saveProfile(id:string,form:FormData) {
      const item=await r.getClientTarget(adminClientId(id));if(!item)throw new Error("Cliente não encontrado.");
      const edit=profileEdit(form);
      if(!edit.updatedAt||edit.updatedAt!==item.profileUpdatedAt)throw new Error("Recarregue a ficha: o perfil mudou desde a abertura.");
      await r.updateProfile(item.userId,edit.name,edit.updatedAt);
    },
    async toggleStatus(id:string,previous:string) {
      const item=await r.getClientTarget(adminClientId(id));
      if(!item||item.status!==previous)throw new Error("Recarregue a ficha antes de mudar o status.");
      await r.updateStatus(item.id,nextClientStatus(previous),previous);
    },
  };
}
