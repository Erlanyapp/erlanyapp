"use server";
import { revalidatePath } from "next/cache";
import { unstable_rethrow } from "next/navigation";
import { requireAdmin } from "@/lib/supabase/admin";
import { createAdminService } from "@/services/admin-service";
import { createAdminProgressService } from "@/services/admin-progress-service";
export type AdminActionState={error?:string;success?:string;clientId?:string};
const message=(error:unknown)=>{unstable_rethrow(error);return error instanceof Error?error.message:typeof error === "object" && error !== null && "message" in error && typeof error.message === "string"?error.message:"Não foi possível salvar. Tente novamente.";};
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

const progressService=async()=>{const {client,user}=await requireAdmin();return createAdminProgressService(client,user.id);};
const refreshProgress=(id:string)=>{revalidatePath(`/admin/clientes/${id}`);revalidatePath("/app/evolucao");};
export async function saveProgressAssessment(clientId:string,id:string|null,_state:AdminActionState,form:FormData):Promise<AdminActionState>{try{await(await progressService()).saveAssessment(clientId,id,form);refreshProgress(clientId);return{success:id?"Avaliação atualizada.":"Avaliação criada."};}catch(error){return{error:message(error)};}}
export async function deleteProgressAssessment(clientId:string,id:string,_state:AdminActionState,_form:FormData):Promise<AdminActionState>{try{await(await progressService()).deleteAssessment(clientId,id);refreshProgress(clientId);return{success:"Avaliação removida. Os registros históricos foram preservados e desvinculados."};}catch(error){return{error:message(error)};}}
export async function saveProgressMeasurement(clientId:string,id:string|null,_state:AdminActionState,form:FormData):Promise<AdminActionState>{try{await(await progressService()).saveMeasurement(clientId,id,form);refreshProgress(clientId);return{success:id?"Medidas atualizadas.":"Medidas registradas."};}catch(error){return{error:message(error)};}}
export async function deleteProgressMeasurement(clientId:string,id:string,_state:AdminActionState,_form:FormData):Promise<AdminActionState>{try{await(await progressService()).deleteMeasurement(clientId,id);refreshProgress(clientId);return{success:"Registro de medidas removido."};}catch(error){return{error:message(error)};}}
export async function savePerformanceRecord(clientId:string,id:string|null,_state:AdminActionState,form:FormData):Promise<AdminActionState>{try{await(await progressService()).savePerformance(clientId,id,form);refreshProgress(clientId);return{success:id?"Desempenho atualizado.":"Desempenho registrado."};}catch(error){return{error:message(error)};}}
export async function deletePerformanceRecord(clientId:string,id:string,_state:AdminActionState,_form:FormData):Promise<AdminActionState>{try{await(await progressService()).deletePerformance(clientId,id);refreshProgress(clientId);return{success:"Registro de desempenho removido."};}catch(error){return{error:message(error)};}}
export async function uploadProgressPhoto(clientId:string,_state:AdminActionState,form:FormData):Promise<AdminActionState>{try{await(await progressService()).uploadPhoto(clientId,form);refreshProgress(clientId);return{success:"Foto privada adicionada."};}catch(error){return{error:message(error)};}}
export async function replaceProgressPhoto(clientId:string,id:string,_state:AdminActionState,form:FormData):Promise<AdminActionState>{try{await(await progressService()).replacePhoto(clientId,id,form);refreshProgress(clientId);return{success:"Foto privada substituída."};}catch(error){return{error:message(error)};}}
export async function deleteProgressPhoto(clientId:string,id:string,_state:AdminActionState,_form:FormData):Promise<AdminActionState>{try{await(await progressService()).deletePhoto(clientId,id);refreshProgress(clientId);return{success:"Foto removida da evolução. O arquivo privado foi preservado para limpeza segura pela biblioteca de mídia."};}catch(error){return{error:message(error)};}}
