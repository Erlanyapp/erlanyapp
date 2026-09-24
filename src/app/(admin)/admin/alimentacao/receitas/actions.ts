"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/supabase/admin";
import { createAdminEditorialService } from "@/services/admin-editorial-service";

export type RecipeActionState = { error?: string; success?: string; coverError?: string };
const service = async () => createAdminEditorialService((await requireAdmin()).client);
const failure = (reason: unknown): RecipeActionState => { const error = reason instanceof Error ? reason.message : "Não foi possível salvar a receita."; return { error, ...(error.includes("capa") || error.includes("imagem") ? { coverError: error } : {}) }; };
const isNextRedirect = (reason: unknown) => typeof reason === "object" && reason !== null && "digest" in reason && typeof reason.digest === "string" && reason.digest.startsWith("NEXT_REDIRECT");
const refreshRecipes = (id?: string) => { revalidatePath("/admin/alimentacao/receitas"); revalidatePath("/admin/alimentacao"); if (id) revalidatePath(`/admin/alimentacao/receitas/${id}`); revalidatePath("/app/alimentacao"); };

export async function saveRecipe(id: string | null, _previous: RecipeActionState, form: FormData): Promise<RecipeActionState> {
  try { const saved = await (await service()).saveRecipe(id, form); refreshRecipes(saved); if (!id) redirect(`/admin/alimentacao/receitas/${saved}`); return { success: "Receita salva." }; } catch (reason) { if (isNextRedirect(reason)) throw reason; console.error("admin.editorial.save_recipe", reason); return failure(reason); }
}
export async function toggleRecipe(id: string, active: boolean) { await (await service()).toggleRecipe(id, active); refreshRecipes(id); }
