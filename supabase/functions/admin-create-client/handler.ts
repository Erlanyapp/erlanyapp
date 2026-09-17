import type { SupabaseClient } from "npm:@supabase/supabase-js@2.57.0";
import { clientRegistration } from "../_shared/client-registration.ts";

type Dependencies = { viewer: () => SupabaseClient; administrator: () => SupabaseClient };
const reply = (status: number, data: Record<string, unknown>) => Response.json(data, {
  status, headers: { "Cache-Control": "no-store" },
});

export function registrationHandler(dependencies: Dependencies) {
  return async (request: Request): Promise<Response> => {
    if (request.method !== "POST") return reply(405, { error: "Método não permitido." });
    const authorization = request.headers.get("authorization") ?? "";
    if (!/^Bearer \S+$/.test(authorization)) return reply(401, { error: "Entre novamente para continuar." });
    try {
      // Auth fetch validates identity AND reads the current managed role, not editable metadata.
      const { data: { user }, error } = await dependencies.viewer().auth.getUser(authorization.slice(7));
      if (error || !user) return reply(401, { error: "Sessão inválida. Entre novamente." });
      if (user.app_metadata?.role !== "ADMIN" || user.email?.toLowerCase() !== "erlanyoliveira95@gmail.com") {
        return reply(403, { error: "Esta operação exige a conta administrativa oficial." });
      }
      if (!request.headers.get("content-type")?.startsWith("application/json")) return reply(415, { error: "Formato inválido." });
      const reader = request.body?.getReader();
      if (!reader) return reply(400, { error: "Informe os dados do cliente." });
      let size = 0, body = "";
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        size += value.byteLength;
        if (size > 16384) { await reader.cancel(); return reply(413, { error: "Dados excedem o limite permitido." }); }
        body += decoder.decode(value, { stream: true });
      }
      body += decoder.decode();
      let registration;
      try {
        const input: unknown = JSON.parse(body);
        if (!input || typeof input !== "object" || Array.isArray(input)) throw new Error("Dados de cadastro inválidos.");
        registration = clientRegistration(input as Record<string, unknown>);
      } catch (validation) {
        return reply(400, { error: validation instanceof Error ? validation.message : "Dados inválidos." });
      }
      // Privileged client is instantiated ONLY after authorization and validation.
      const admin = dependencies.administrator();
      const created = await admin.auth.admin.createUser({
        email: registration.email, password: registration.password, email_confirm: true,
        user_metadata: { full_name: registration.name },
        app_metadata: { role: "CLIENT", crm_created_by: user.id },
      });
      if (created.error) {
        const duplicate = ["email_exists", "user_already_exists"].includes(created.error.code ?? "");
        return reply(duplicate ? 409 : 502, { error: duplicate
          ? "Este e-mail já possui uma conta. Busque o cliente na listagem; nenhuma conta foi alterada."
          : "O Supabase Auth recusou o cadastro. Nenhuma senha foi salva pelo CRM." });
      }
      if (!created.data.user || created.data.user.app_metadata?.role !== "CLIENT") {
        return reply(502, { error: "O Auth retornou um cadastro inesperado. Não repita o envio; solicite revisão administrativa." });
      }
      // Existing Auth trigger creates Profile and Client in the same Auth transaction.
      const [target, profile] = await Promise.all([
        admin.from("clients").select("id").eq("user_id", created.data.user.id).single(),
        admin.from("profiles").select("role").eq("id", created.data.user.id).single(),
      ]);
      if (target.error || !target.data || profile.error || profile.data?.role !== "CLIENT") return reply(502, { error: "A conta Auth foi criada, mas a ficha não pôde ser confirmada. Não repita o envio; revise o cadastro." });
      return reply(201, { clientId: target.data.id, message: "Cliente criado. Entregue a senha inicial por um canal seguro." });
    } catch {
      // Never return upstream exceptions, tokens, passwords or serialized user objects.
      return reply(502, { error: "Não foi possível concluir a comunicação com o Supabase. Verifique a listagem antes de tentar novamente." });
    }
  };
}
