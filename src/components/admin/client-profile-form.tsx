"use client";
import { useActionState } from "react";
import { saveAdminClientProfile,toggleAdminClientStatus } from "@/app/(admin)/admin/clientes/actions";
export function ClientProfileForm({item}:{item:{id:string;fullName:string|null;email:string|null;profileUpdatedAt:string}}) {
  const [state,action,pending]=useActionState(saveAdminClientProfile.bind(null,item.id),{});
  return <form className="crm-profile-form" action={action}><h3>Dados do perfil</h3><p>Edite o nome cadastrado. E-mail e identidade são gerenciados pelo Auth.</p><input type="hidden" name="updatedAt" value={item.profileUpdatedAt}/><label>Nome completo<input name="name" defaultValue={item.fullName??""} required minLength={2} maxLength={100} autoComplete="name"/></label><label>E-mail<input value={item.email??"Não informado"} readOnly aria-readonly="true"/></label><p className="crm-field-note">Telefone, nascimento, gênero e observações ainda não existem no schema; nenhum dado fictício foi adicionado.</p><button className="button button-primary" disabled={pending} type="submit">{pending?"Salvando…":"Salvar alterações"}</button>{state.error?<p role="alert" className="crm-feedback error">{state.error}</p>:null}{state.success?<p role="status" className="crm-feedback">{state.success}</p>:null}</form>;
}
export function ClientStatusAction({id,status}:{id:string;status:string}) {
  const [state,action,pending]=useActionState(toggleAdminClientStatus.bind(null,id,status),{});
  if(status!=="active"&&status!=="inactive")return <p>Status sem transição disponível.</p>;
  return <form action={action} className="crm-status-action"><label><input type="checkbox" required/> Confirmo a alteração do cadastro</label><button className="button button-secondary" type="submit" disabled={pending}>{pending?"Atualizando…":status==="active"?"Desativar cadastro":"Ativar cadastro"}</button>{state.error?<p role="alert">{state.error}</p>:null}{state.success?<p role="status">{state.success}</p>:null}</form>;
}
