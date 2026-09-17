"use server";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/supabase/admin";
import { createAdminExerciseService } from "@/services/admin-exercise-service";
export type ExerciseActionState={error?:string;success?:string;thumbnailError?:string;videoError?:string};
const message=(e:unknown)=>e instanceof Error?e.message:"Não foi possível salvar o exercício.";
const failed=(cause:unknown):ExerciseActionState=>{const error=message(cause);return {error,...(error.includes("foto")||error.includes("imagem")?{thumbnailError:error}:{}),...(error.includes("YouTube")?{videoError:error}:{})};};
const diagnostic=(cause:unknown)=>{if(cause&&typeof cause==="object"){const error=cause as {code?:unknown;details?:unknown;hint?:unknown;message?:unknown};return {code:error.code,details:error.details,hint:error.hint,message:error.message};}return {message:String(cause)};};
export async function saveExercise(id:string|null,_:ExerciseActionState,form:FormData):Promise<ExerciseActionState>{const {client}=await requireAdmin();try{await createAdminExerciseService(client).save(id,form);revalidatePath("/admin/exercicios");return {success:id?"Exercício atualizado.":"Exercício criado."};}catch(e){console.error("admin.exercise.save_failed",diagnostic(e));return failed(e);}}
export async function toggleExercise(id:string,active:boolean):Promise<{active:boolean}|{error:string}>{const {client}=await requireAdmin();try{const updated=await createAdminExerciseService(client).toggle(id,active);revalidatePath("/admin/exercicios");return {active:updated};}catch(e){console.error("admin.exercise.toggle_failed",diagnostic(e));return {error:"Não foi possível atualizar o status do exercício."};}}
