import { notFound } from "next/navigation";
import Link from "next/link";
import { requireAdmin } from "@/lib/supabase/admin";
import { createAdminExerciseService } from "@/services/admin-exercise-service";
import { ExerciseForm } from "@/components/admin/exercise-form";
export default async function ExercisePage({params}:{params:Promise<{id:string}>}){const {id}=await params,{client}=await requireAdmin(),s=createAdminExerciseService(client);const categories=await s.categories();const item=id==="novo"?undefined:await s.get(id);if(id!=="novo"&&!item)notFound();return <div><Link className="admin-back" href="/admin/exercicios">Voltar para exercícios</Link><div className="crm-page-heading"><div><p className="admin-overline">BIBLIOTECA DE EXERCÍCIOS</p><h2>{item?"Editar exercício":"Novo exercício"}</h2></div></div><ExerciseForm item={item??undefined} categories={categories}/></div>}
