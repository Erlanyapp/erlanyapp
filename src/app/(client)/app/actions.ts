"use server";
import { revalidatePath } from "next/cache";
import { getClientAccount } from "@/services/server-account";
import { getWorkoutCheckinService } from "@/services/server-workout-checkin";
import type { ActionResult } from "@/types/account";

async function runMutation(form: FormData, operation: "saveProfile" | "saveWeight" | "contact"): Promise<ActionResult> {
  // Auth/redirect remains outside the catch; identities never come from form fields.
  const { account, service } = await getClientAccount();
  try {
    await service[operation](account, form);
    revalidatePath("/app", "layout");
    return { ok: true, message: operation === "contact" ? "Mensagem enviada. A resposta aparecerá nesta página." : "Dados salvos com sucesso." };
  } catch (error) {
    console.error(`[client/${operation}]`, error instanceof Error ? error.message : "Backend operation failed");
    return { ok: false, message: error instanceof Error ? error.message : "Não foi possível salvar. Tente novamente." };
  }
}
export async function saveProfile(form: FormData) { return runMutation(form, "saveProfile"); }
export async function saveWeight(form: FormData) { return runMutation(form, "saveWeight"); }
export async function sendSupportMessage(form: FormData) { return runMutation(form, "contact"); }

export async function markWorkoutPaid(_previous: ActionResult, form: FormData): Promise<ActionResult> {
  const assignmentId = String(form.get("assignmentId") ?? "");
  const workoutId = String(form.get("workoutId") ?? "");
  try {
    if (!assignmentId || !workoutId) return { ok: false, message: "Treino inválido." };
    const result = await (await getWorkoutCheckinService()).record(assignmentId, workoutId);
    revalidatePath("/app", "layout");
    return { ok: true, message: result.alreadyCheckedIn ? "Treino já realizado hoje." : "Tá pago! Treino registrado." };
  } catch (error) {
    console.error("[client/markWorkoutPaid]", error);
    return { ok: false, message: "Não foi possível registrar o treino. Tente novamente." };
  }
}
