import Link from "next/link";
import type { ClientTab } from "@/domain/admin-client";
export const adminDate=(value:string|null)=>value?new Intl.DateTimeFormat("pt-BR",{timeZone:"America/Sao_Paulo"}).format(new Date(value.length===10?value+"T12:00:00Z":value)):"Ainda não registrado";
export const subscriptionLabel=(value:string|undefined)=>({active:"Ativa",trialing:"Período de teste",canceled:"Cancelada",past_due:"Pagamento pendente",expired:"Expirada",inactive:"Inativa"}[value??""]??value??"Nenhuma assinatura registrada");
export function ClientStatusBadge({status}:{status:string}) {return <span className={`admin-status ${status==="active"?"active":status==="inactive"?"inactive":""}`}>{status==="active"?"Ativo":status==="inactive"?"Inativo":status}</span>;}
export function ClientMetricCard({label,value,detail}:{label:string;value:string;detail?:string}) {return <section className="crm-metric"><p>{label}</p><strong>{value}</strong>{detail?<small>{detail}</small>:null}</section>;}
export function ClientEmptyState({title,description}:{title:string;description:string}) {return <section className="admin-state crm-empty"><h3>{title}</h3><p>{description}</p></section>;}
export function ClientTabs({id,active}:{id:string;active:ClientTab}) {
  const tabs:[ClientTab,string][]=[["visao-geral","Visão geral"],["perfil","Perfil"],["treinos","Treinos"],["alimentacao","Alimentação"],["evolucao","Evolução"],["midia","Mídia"],["historico","Histórico"]];
  return <nav className="crm-tabs" aria-label="Seções da ficha">{tabs.map(([key,label])=><Link key={key} href={`/admin/clientes/${id}?aba=${key}`} aria-current={active===key?"page":undefined}>{label}</Link>)}</nav>;
}
