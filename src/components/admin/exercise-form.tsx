"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { saveExercise } from "@/app/(admin)/admin/exercicios/actions";
import { MAX_EXERCISE_THUMBNAIL_BYTES } from "@/domain/admin-exercise";
import type { AdminExercise } from "@/types/admin-exercise";

type Fields={name:string;categoryId:string;description:string;instructions:string;videoUrl:string;muscles:string;equipment:string;level:string;scope:"GLOBAL"|"CLIENT";clientId:string;isActive:boolean};
const valuesFor=(item?:AdminExercise):Fields=>({name:item?.name??"",categoryId:item?.categoryId??"",description:item?.description??"",instructions:item?.instructions??"",videoUrl:item?.videoId?`https://youtu.be/${item.videoId}`:"",muscles:item?.muscles.join(", ")??"",equipment:item?.equipment??"",level:item?.level??"Iniciante",scope:item?.scope??"GLOBAL",clientId:item?.clientId??"",isActive:item?.isActive??true});
const supportedTypes=["image/png","image/jpeg","image/webp"];

export function ExerciseForm({item,categories}:{item?:AdminExercise;categories:{id:string;name:string}[]}){
 const [state,action,pending]=useActionState(saveExercise.bind(null,item?.id??null),{});
 const [values,setValues]=useState<Fields>(()=>valuesFor(item));
 const [preview,setPreview]=useState<string|null>(item?.thumbnailUrl??null);
 const [thumbnailError,setThumbnailError]=useState<string>();
 const fileRef=useRef<HTMLInputElement>(null);
 useEffect(()=>()=>{if(preview?.startsWith("blob:"))URL.revokeObjectURL(preview);},[preview]);
 useEffect(()=>{if(!state.success)return;setValues(valuesFor(item));setThumbnailError(undefined);if(fileRef.current)fileRef.current.value="";setPreview(item?.thumbnailUrl??null);},[state.success,item]);
 const update=<K extends keyof Fields>(field:K,value:Fields[K])=>setValues(current=>({...current,[field]:value}));
 const changeThumbnail=(file:File|undefined)=>{
   setThumbnailError(undefined);
   if(!file||!file.name||file.size===0){setPreview(item?.thumbnailUrl??null);return;}
   if(file.size>MAX_EXERCISE_THUMBNAIL_BYTES){setThumbnailError("A foto deve ter no máximo 4 MB.");if(fileRef.current)fileRef.current.value="";return;}
   if(!supportedTypes.includes(file.type)){setThumbnailError("Use uma imagem PNG, JPG ou WebP.");if(fileRef.current)fileRef.current.value="";return;}
   setPreview(URL.createObjectURL(file));
 };
 const photoError=thumbnailError??state.thumbnailError;
 return <form className="crm-profile-form exercise-form" action={action} encType="multipart/form-data"><h3>{item?"Editar exercício":"Novo exercício"}</h3>
   <label>Nome<input name="name" required minLength={2} maxLength={120} value={values.name} onChange={event=>update("name",event.target.value)}/></label>
   <label>Categoria<select name="categoryId" required value={values.categoryId} onChange={event=>update("categoryId",event.target.value)}><option value="" disabled>Selecione</option>{categories.map(category=><option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
   <label>Descrição<textarea name="description" maxLength={4000} value={values.description} onChange={event=>update("description",event.target.value)}/></label>
   <label>Instruções<textarea name="instructions" maxLength={8000} value={values.instructions} onChange={event=>update("instructions",event.target.value)}/></label>
   <label>Vídeo do YouTube<input name="videoUrl" type="url" placeholder="https://youtu.be/..." value={values.videoUrl} onChange={event=>update("videoUrl",event.target.value)} aria-describedby={state.videoError?"video-error":undefined}/>{state.videoError?<small id="video-error" className="crm-feedback error">{state.videoError}</small>:null}</label>
   <label>Thumbnail / imagem<input ref={fileRef} name="thumbnail" type="file" accept="image/png,image/jpeg,image/webp" onChange={event=>changeThumbnail(event.target.files?.[0])} aria-describedby={photoError?"thumbnail-error":undefined}/><small>Opcional. PNG, JPEG ou WebP, até 4 MB.</small>{photoError?<small id="thumbnail-error" role="alert" className="crm-feedback error">{photoError}</small>:null}{preview?<Image className="exercise-thumbnail-preview" src={preview} alt="Prévia da thumbnail" width={140} height={96} unoptimized/>:<span className="exercise-thumbnail-placeholder">Sem thumbnail</span>}</label>
   <label>Músculos trabalhados<input name="muscles" placeholder="Ex.: glúteos, quadríceps" value={values.muscles} onChange={event=>update("muscles",event.target.value)}/></label>
   <label>Equipamento<input name="equipment" maxLength={100} value={values.equipment} onChange={event=>update("equipment",event.target.value)}/></label>
   <label>Nível<select name="level" value={values.level} onChange={event=>update("level",event.target.value)}><option>Iniciante</option><option>Intermediário</option><option>Avançado</option></select></label>
   <label>Visibilidade<select name="scope" value={values.scope} onChange={event=>update("scope",event.target.value as Fields["scope"])}><option value="GLOBAL">Global</option><option value="CLIENT">Cliente</option></select></label>
   <label>ID do cliente (somente conteúdo CLIENT)<input name="clientId" value={values.clientId} onChange={event=>update("clientId",event.target.value)} placeholder="UUID do cliente"/></label>
   <label className="crm-create-confirm"><input name="isActive" type="checkbox" checked={values.isActive} onChange={event=>update("isActive",event.target.checked)}/> Exercício ativo</label>
   <button className="button button-primary" disabled={pending}>{pending?"Enviando imagem e salvando…":"Salvar exercício"}</button>{state.error&&!state.thumbnailError&&!state.videoError?<p role="alert" className="crm-feedback error">{state.error}</p>:null}{state.success?<p role="status" className="crm-feedback">{state.success}</p>:null}
 </form>;
}
