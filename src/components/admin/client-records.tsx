import Image from "next/image";
import Link from "next/link";
import type { AdminClientRecords } from "@/types/admin";
import type { ClientTab } from "@/domain/admin-client";
import { adminDate,ClientEmptyState } from "./client-primitives";

export function ClientRecords({data,id,tab}:{data:AdminClientRecords;id:string;tab:ClientTab}) {
  const pages=Math.max(1,...data.groups.map(group=>Math.ceil(group.total/data.pageSize)));
  const url=(page:number)=>`/admin/clientes/${id}?aba=${tab}&registros=${page}`;
  return <div className="crm-records"><p className="crm-record-note">Somente registros associados a este cliente. {tab==="historico"?"Auditoria real, somente leitura; nenhuma linha do tempo fictícia.":"Consulta somente leitura; os editores completos pertencem às próximas fases."}</p>
    {data.groups.map(group=><section className="crm-record-group" key={group.title}><div className="crm-section-heading"><h3>{group.title}</h3><p>{group.total} registro(s)</p></div>
      {group.records.length?<div className="crm-overview-grid">{group.records.map(record=><article className="crm-metric crm-record" key={record.id}><strong>{record.title}</strong><small>{adminDate(record.date)}</small>
        {record.description?<p>{record.description}</p>:null}
        {record.fields.length?<dl>{record.fields.map(field=><div key={field.label}><dt>{field.label}</dt><dd>{field.value}</dd></div>)}</dl>:null}
        {record.imageUrl?<><Image src={record.imageUrl} alt={record.title} width={320} height={240} unoptimized/><a href={record.imageUrl} target="_blank" rel="noopener noreferrer">Abrir arquivo privado</a></>:null}
        {record.imageError?<p role="alert">O registro existe, mas o arquivo privado não pôde ser carregado.</p>:null}
      </article>)}</div>:<ClientEmptyState title={group.total?"Nenhum registro nesta página":group.empty} description={group.total?"Volte à página anterior para consultar os registros.":"Os dados aparecerão aqui quando estiverem cadastrados para este cliente."}/>}</section>)}
    {pages>1||data.page>1?<nav className="admin-pagination" aria-label="Paginação de registros"><span>Página {data.page} de {pages} · até {data.pageSize} registros por seção</span>{data.page>1?<Link href={url(data.page-1)}>Anterior</Link>:null}{data.page<pages?<Link href={url(data.page+1)}>Próxima</Link>:null}</nav>:null}
  </div>;
}
