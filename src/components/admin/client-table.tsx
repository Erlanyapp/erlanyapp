import Link from "next/link";
import { ProfileAvatar } from "@/components/client/profile-avatar";
import type { AdminClient } from "@/types/admin";
import type { AdminSearchParams } from "@/domain/admin-client";
import { adminDate,ClientStatusBadge,ClientEmptyState } from "./client-primitives";
function pageUrl(params:AdminSearchParams,page:number) {
  const query=new URLSearchParams();for(const key of ["q","status","plan","from","to"])if(typeof params[key]==="string"&&params[key])query.set(key,params[key] as string);
  query.set("page",String(page));return "/admin/clientes?"+query.toString();
}
export function AdminClientTable({result,params}:{result:{clients:AdminClient[];total:number;page:number;pageSize:number};params:AdminSearchParams}) {
  const pages=Math.max(1,Math.ceil(result.total/result.pageSize));
  return <><section className="crm-table-panel">{result.clients.length?<div className="admin-table-wrap"><table className="crm-client-table"><caption className="sr-only">Clientes cadastrados no ERLANY FIT</caption><thead><tr><th scope="col">Cliente</th><th scope="col">Status</th><th scope="col">Plano</th><th scope="col">Cadastro</th><th scope="col">Última atividade</th><th scope="col"><span className="sr-only">Ações</span></th></tr></thead><tbody>{result.clients.map(x=><tr key={x.id}><td><div className="crm-client-cell"><ProfileAvatar account={{name:x.fullName||"Sem nome",avatarUrl:x.avatarUrl}}/><div><Link href={`/admin/clientes/${x.id}`}>{x.fullName||"Sem nome"}</Link><span>{x.email||"E-mail não informado"}</span>{x.avatarError?<small>Foto indisponível</small>:null}</div></div></td><td><ClientStatusBadge status={x.status}/></td><td>{x.planName||"Não definido"}</td><td>{adminDate(x.createdAt)}</td><td>{adminDate(x.lastAccessAt)}</td><td><Link aria-label={`Abrir ficha de ${x.fullName||"cliente"}`} href={`/admin/clientes/${x.id}`}>Abrir ficha</Link></td></tr>)}</tbody></table></div>:<ClientEmptyState title="Nenhum cliente encontrado" description="Ajuste os filtros ou compartilhe o cadastro oficial para adicionar um cliente."/>}</section><nav className="admin-pagination" aria-label="Paginação de clientes"><span>{result.total} registro(s) · Página {result.page} de {pages}</span>{result.page>1?<Link href={pageUrl(params,result.page-1)}>Anterior</Link>:null}{result.page*result.pageSize<result.total?<Link href={pageUrl(params,result.page+1)}>Próxima</Link>:null}</nav></>;
}
