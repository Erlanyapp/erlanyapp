"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/supabase/admin";
import { createAdminNutritionService } from "@/services/admin-nutrition-service";

export type NutritionActionState = { error?: string };
const service = async () => createAdminNutritionService((await requireAdmin()).client);
const refresh = (id?: string) => { revalidatePath("/admin/alimentacao"); if (id) revalidatePath(`/admin/alimentacao/${id}`); revalidatePath("/app/alimentacao"); };
const detail = (error: unknown) => error instanceof Error ? error.message : "Erro desconhecido.";
export async function saveNutritionPlan(id: string | null, _previous: NutritionActionState, form: FormData): Promise<NutritionActionState> {
  let planId: string;
  try { planId = await (await service()).save(id, form); }
  catch (error) { console.error("admin.nutrition.save_plan", error); return { error: `Não foi possível salvar o plano: ${detail(error)}` }; }
  refresh(planId);
  redirect(`/admin/alimentacao/${planId}`);
}
export async function toggleNutritionPlan(id: string, active: boolean) { await (await service()).toggle(id, active); refresh(id); }
export async function saveNutritionMeal(planId: string, id: string | null, form: FormData) { await (await service()).saveMeal(planId, id, form); refresh(planId); }
export async function removeNutritionMeal(planId: string, id: string) { await (await service()).removeMeal(planId, id); refresh(planId); }
export async function assignNutritionPlan(planId: string, form: FormData) { await (await service()).assign(planId, form); refresh(planId); }
export async function updateNutritionAssignment(planId: string, id: string, form: FormData) { await (await service()).updateAssignment(planId, id, form); await (await service()).toggleAssignment(id, form.get("isActive") === "on"); refresh(planId); }
export async function toggleNutritionAssignment(planId: string, id: string, active: boolean) { await (await service()).toggleAssignment(id, active); refresh(planId); }
export async function cancelNutritionAssignment(planId: string, id: string) { await (await service()).cancelAssignment(id); refresh(planId); }
