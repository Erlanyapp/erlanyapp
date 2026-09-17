"use server";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/supabase/admin";
import { createAdminService } from "@/services/admin-service";
export type AdminActionState={error?:string;success?:string;clientId?:string};
const message=(error:unknown)=>error instanceof Error?error.message:"Não foi possível salvar. Tente novamente.";
export async function createAdminClient(_state:AdminActionState,form:FormData):Promise<AdminActionState> {
  const {client}=await requireAdmin();
  let clientId:string;
  try {clientId=await createAdminService(client).createClient(form);}
  catch(error){return {error:message(error)};}
  revalidatePath("/admin");revalidatePath("/admin/clientes");
  return {clientId,success:"Cliente criado com acesso CLIENT. Entregue a senha inicial por um canal seguro."};
}
export async function saveAdminClientProfile(id:string,_state:AdminActionState,form:FormData):Promise<AdminActionState> {
  const {client}=await requireAdmin();
  try {await createAdminService(client).saveProfile(id,form);}
  catch(error){return {error:message(error)};}
  revalidatePath("/admin/clientes");revalidatePath(`/admin/clientes/${id}`);revalidatePath("/app","layout");
  return {success:"Perfil salvo com sucesso."};
}
export async function toggleAdminClientStatus(id:string,previous:string,_state:AdminActionState,_form:FormData):Promise<AdminActionState> {
  const {client}=await requireAdmin();
  try {await createAdminService(client).toggleStatus(id,previous);}
  catch(error){return {error:message(error)};}
  revalidatePath("/admin/clientes");revalidatePath(`/admin/clientes/${id}`);
  return {success:"Status do cadastro atualizado. A assinatura e o acesso Auth não foram alterados."};
}
