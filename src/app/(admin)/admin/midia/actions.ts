"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/supabase/admin";
import { createAdminMediaService } from "@/services/admin-media-service";
export type MediaActionState={error?:string;success?:string};
const service=async()=>createAdminMediaService((await requireAdmin()).client);
const fail=(e:unknown):MediaActionState=>({error:e instanceof Error?e.message:"Não foi possível salvar a mídia."});
const redirectError=(e:unknown)=>typeof e==="object"&&e!==null&&"digest" in e&&typeof e.digest==="string"&&e.digest.startsWith("NEXT_REDIRECT");
const refresh=(id?:string)=>{revalidatePath("/admin/midia");if(id)revalidatePath(`/admin/midia/${id}`);};
export async function saveMedia(id:string|null,_:MediaActionState,form:FormData):Promise<MediaActionState>{try{const kind=form.get("kind")==="video"?"video":"image";const saved=kind==="image"?await(await service()).saveImage(id,form):await(await service()).saveVideo(id,form);refresh(saved);if(!id)redirect(`/admin/midia/${saved}`);return{success:"Mídia salva."};}catch(e){if(redirectError(e))throw e;console.error("admin.media.save",e);return fail(e);}}
export async function toggleVideo(id:string,active:boolean){await(await service()).toggleVideo(id,active);refresh(id);}
export async function deleteMedia(id:string):Promise<MediaActionState>{try{await(await service()).delete(id);refresh();return{success:"Mídia excluída."};}catch(e){return fail(e);}}
