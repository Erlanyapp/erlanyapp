export const EXERCISE_PAGE_SIZE=20;
export const exerciseLevels=["Iniciante","Intermediário","Avançado"] as const;
export type ExerciseLevel=typeof exerciseLevels[number];
export type ExerciseFilters=Record<string,string|string[]|undefined>;
const uuid=(value:unknown)=>typeof value==="string"&&/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)?value:null;
const text=(v:FormDataEntryValue|null,max:number)=>typeof v==="string"?v.trim().slice(0,max):"";
export function exerciseId(v:unknown){const id=uuid(v);if(!id)throw new Error("Exercício inválido.");return id;}
export function exerciseSlug(name:string){
 const slug=name.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"");
 return slug||"exercicio";
}
export function exerciseListFilters(p:ExerciseFilters){
 const page=typeof p.page==="string"&&Number.isSafeInteger(Number(p.page))?Math.max(1,Math.min(100000,Number(p.page))):1;
 const status=p.status==="active"||p.status==="inactive"?p.status:"all";
 return {page,pageSize:EXERCISE_PAGE_SIZE,search:typeof p.q==="string"?p.q.trim().slice(0,100):"",categoryId:p.category==="all"?null:uuid(p.category),level:exerciseLevels.includes(p.level as ExerciseLevel)?p.level as ExerciseLevel:null,equipment:typeof p.equipment==="string"&&p.equipment!=="all"?p.equipment.trim().slice(0,100):null,status};
}
export function youtubeId(value:string){
 try {const u=new URL(value);const id=u.hostname==="youtu.be"?u.pathname.slice(1):u.searchParams.get("v")??(u.pathname.match(/\/(?:embed|shorts)\/([\w-]{11})/)??[])[1];return /^[\w-]{11}$/.test(id??"")?id!:null;}catch{return null;}
}
export const MAX_EXERCISE_THUMBNAIL_BYTES=4*1024*1024;
export type ExerciseThumbnail={bytes:Uint8Array;contentType:"image/png"|"image/jpeg"|"image/webp";extension:"png"|"jpg"|"webp"}|null;
const isSelectedFile=(value:FormDataEntryValue|null):value is File=>typeof File!=="undefined"&&value instanceof File&&value.name.length>0&&value.size>0;
export async function exerciseThumbnail(value:FormDataEntryValue|null):Promise<ExerciseThumbnail>{
 if(!isSelectedFile(value))return null;
 if(value.size>MAX_EXERCISE_THUMBNAIL_BYTES)throw new Error("A foto deve ter no máximo 4 MB.");
 if(value.type!=="image/png"&&value.type!=="image/jpeg"&&value.type!=="image/webp")throw new Error("Use uma imagem PNG, JPG ou WebP.");
 const bytes=new Uint8Array(await value.arrayBuffer());
 const png=[137,80,78,71,13,10,26,10].every((byte,index)=>bytes[index]===byte);
 const jpeg=bytes[0]===255&&bytes[1]===216&&bytes[2]===255;
 const webp=String.fromCharCode(...bytes.slice(0,4))==="RIFF"&&String.fromCharCode(...bytes.slice(8,12))==="WEBP";
 if((value.type==="image/png"&&!png)||(value.type==="image/jpeg"&&!jpeg)||(value.type==="image/webp"&&!webp))throw new Error("Use uma imagem PNG, JPG ou WebP.");
 return {bytes,contentType:value.type,extension:value.type==="image/jpeg"?"jpg":value.type.slice(6) as "png"|"webp"};
}
export function exerciseInput(form:FormData){
 const name=text(form.get("name"),120);if(name.length<2)throw new Error("Informe um nome com pelo menos 2 caracteres.");
 const categoryId=uuid(form.get("categoryId"));if(!categoryId)throw new Error("Selecione uma categoria.");
 const level=text(form.get("level"),30);if(!exerciseLevels.includes(level as ExerciseLevel))throw new Error("Selecione um nível válido.");
 const scope=form.get("scope")==="CLIENT"?"CLIENT":"GLOBAL";const clientId=scope==="CLIENT"?uuid(form.get("clientId")):null;if(scope==="CLIENT"&&!clientId)throw new Error("Informe o ID do cliente para conteúdo privado.");
 const videoUrl=text(form.get("videoUrl"),500);if(videoUrl&&!youtubeId(videoUrl))throw new Error("Informe uma URL válida do YouTube.");
 return {name,categoryId,description:text(form.get("description"),4000)||null,instructions:text(form.get("instructions"),8000)||null,muscles:text(form.get("muscles"),500).split(",").map(x=>x.trim()).filter(Boolean).slice(0,20),equipment:text(form.get("equipment"),100)||null,level:level as ExerciseLevel,scope,clientId,videoId:videoUrl?youtubeId(videoUrl):null,isActive:form.get("isActive")==="on"};
}
