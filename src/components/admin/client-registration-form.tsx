"use client";
import Link from "next/link";
import { useActionState } from "react";
import { createAdminClient } from "@/app/(admin)/admin/clientes/actions";

export function ClientRegistrationForm() {
  const [state,action,pending]=useActionState(createAdminClient,{});
  return <form className="crm-profile-form crm-create-form" action={action}><h3>Cadastrar cliente</h3><p>Crie um acesso CLIENT pelo Supabase Auth. Este formulário nunca cria administradores.</p>
    <label>Nome completo<input name="name" required minLength={2} maxLength={100} autoComplete="off"/></label>
    <label>E-mail<input name="email" required type="email" maxLength={254} autoComplete="off"/></label>
    <label>Senha inicial<input name="password" type="password" required minLength={12} maxLength={128} autoComplete="new-password" aria-describedby="crm-password-note"/></label>
    <p id="crm-password-note">Use maiúscula, minúscula e número. A senha é enviada somente ao Auth. Não é registrada no perfil, histórico ou logs.</p>
    <label className="crm-create-confirm"><input type="checkbox" name="confirmed" required/> Validei o e-mail e entregarei a senha por um canal seguro. O acesso será liberado sem envio de convite.</label>
    <button className="button button-primary" type="submit" disabled={pending||!!state.clientId}>{pending?"Criando acesso…":state.clientId?"Cliente criado":"Criar cliente"}</button>
    {state.error?<p className="crm-feedback error" role="alert">{state.error}</p>:null}
    {state.success?<p className="crm-feedback" role="status">{state.success}</p>:null}
    {state.clientId?<Link href={`/admin/clientes/${state.clientId}`}>Abrir ficha do cliente criado</Link>:null}
  </form>;
}
