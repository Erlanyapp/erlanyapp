import { ClientRegistrationForm } from "./client-registration-form";
import type { AdminSearchParams } from "@/domain/admin-client";
const value=(x:string|string[]|undefined)=>typeof x==="string"?x:"";
export function AdminClientFilters({params,plans}:{params:AdminSearchParams;plans:{id:string;name:string}[]}) {
  return <><form className="crm-filters" action="/admin/clientes" method="get"><label className="crm-search">Buscar cliente<input name="q" defaultValue={value(params.q)} maxLength={100} placeholder="Nome ou e-mail"/></label><label>Status do cadastro<select name="status" defaultValue={value(params.status)||"all"}><option value="all">Todos</option><option value="active">Ativos</option><option value="inactive">Inativos</option></select></label><label>Plano<select name="plan" defaultValue={value(params.plan)||"all"}><option value="all">Todos os planos</option>{plans.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></label><label>Cadastrado de<input type="date" name="from" defaultValue={value(params.from)}/></label><label>Até<input type="date" name="to" defaultValue={value(params.to)}/></label><div className="crm-filter-actions"><button className="button button-primary" type="submit">Aplicar filtros</button><button className="crm-clear-filters" type="submit" form="crm-clear-filters">Limpar</button></div></form><form id="crm-clear-filters" action="/admin/clientes" method="get" hidden/></>;
}
export function AddClientRegistration() {
  return <details className="crm-registration"><summary className="button button-primary">Adicionar cliente</summary><div><ClientRegistrationForm/></div></details>;
}
