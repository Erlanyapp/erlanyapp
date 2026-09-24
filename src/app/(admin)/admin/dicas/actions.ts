"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/supabase/admin";
import { createAdminEditorialService } from "@/services/admin-editorial-service";

export type EditorialActionState = { error?: string; success?: string; coverError?: string };
const service = async () => createAdminEditorialService((await requireAdmin()).client);
const failure = (reason: unknown): EditorialActionState => { const error = reason instanceof Error ? reason.message : "Não foi possível salvar o conteúdo."; return { error, ...(error.includes("capa") || error.includes("imagem") ? { coverError: error } : {}) }; };
const isNextRedirect = (reason: unknown) => typeof reason === "object" && reason !== null && "digest" in reason && typeof reason.digest === "string" && reason.digest.startsWith("NEXT_REDIRECT");
const refreshTips = (id?: string) => { revalidatePath("/admin/dicas"); if (id) revalidatePath(`/admin/dicas/${id}`); revalidatePath("/app/dicas"); };

export async function saveTip(id: string | null, _previous: EditorialActionState, form: FormData): Promise<EditorialActionState> {
  try { const saved = await (await service()).saveTip(id, form); refreshTips(saved); if (!id) redirect(`/admin/dicas/${saved}`); return { success: "Dica salva." }; } catch (reason) { if (isNextRedirect(reason)) throw reason; console.error("admin.editorial.save_tip", reason); return failure(reason); }
}
export async function toggleTip(id: string, active: boolean) { await (await service()).toggleTip(id, active); refreshTips(id); }
