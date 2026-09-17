"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toggleExercise } from "@/app/(admin)/admin/exercicios/actions";

export function ExerciseActions({id,name,isActive}:{id:string;name:string;isActive:boolean}) {
  const router=useRouter();
  const [active,setActive]=useState(isActive);
  const [error,setError]=useState<string>();
  const [pending,startTransition]=useTransition();
  useEffect(()=>setActive(isActive),[isActive]);
  const toggle=()=>startTransition(async()=>{
    setError(undefined);
    const result=await toggleExercise(id,!active);
    if ("error" in result) { setError(result.error); return; }
    setActive(result.active);
    router.refresh();
  });
  return <div className="exercise-actions"><Link className="exercise-action edit" href={`/admin/exercicios/${id}`}>Editar</Link><button className="exercise-action toggle" type="button" onClick={toggle} disabled={pending} aria-label={`${active?"Desativar":"Ativar"} ${name}`}>{pending?"Atualizando…":active?"Desativar":"Ativar"}</button>{error?<p className="exercise-action-error" role="alert">{error}</p>:null}</div>;
}
