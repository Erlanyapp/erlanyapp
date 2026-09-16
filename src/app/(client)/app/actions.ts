"use server";
import { revalidatePath } from "next/cache";
import { getClientAccount } from "@/services/server-account";
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
