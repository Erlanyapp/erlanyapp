"use server";
import { revalidatePath } from "next/cache";
import { getClientAccount } from "@/services/server-account";
import { getWorkoutCheckinService } from "@/services/server-workout-checkin";
import { getClientIntake } from "@/services/server-client-intake";
import { intakeDraft, intakeInput } from "@/domain/client-intake";
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
export async function saveInitialIntakeDraft(form: FormData): Promise<ActionResult> {
  const intake = await getClientIntake();
  try {
    await intake.saveDraft(intakeDraft(form));
    return { ok: true, message: "Rascunho salvo." };
  } catch (error) {
    console.error("[client/intake-draft]", error instanceof Error ? error.message : "failed");
    return { ok: false, message: "Não foi possível salvar o rascunho. Seus campos continuam nesta tela." };
  }
}

export async function saveInitialIntake(form: FormData): Promise<ActionResult> {
  const intake = await getClientIntake();
  try {
    await intake.save(intakeInput(form));
    revalidatePath("/app", "layout");
    return { ok: true, message: "Ficha inicial concluída com sucesso." };
  } catch (error) {
    console.error("[client/intake]", error instanceof Error ? error.message : "failed");
    return { ok: false, message: error instanceof Error ? error.message : "Não foi possível salvar sua ficha. Tente novamente." };
  }
}

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
