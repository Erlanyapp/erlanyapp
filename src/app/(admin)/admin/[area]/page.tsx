import { notFound } from "next/navigation";
import { adminNavigation } from "@/config/admin-navigation";
import { ClientEmptyState } from "@/components/admin/client-primitives";
export default async function AdminFutureArea({params}:{params:Promise<{area:string}>}) {
  const {area}=await params,item=adminNavigation.find(x=>x.href==="/admin/"+area&&area!=="clientes");if(!item)notFound();
  return <div><div className="crm-page-heading"><div><p className="admin-overline">ÁREA ADMINISTRATIVA</p><h2>{item.label}</h2></div></div><ClientEmptyState title="Gerenciamento em próxima fase" description="Esta área está preparada na navegação do CRM. Nenhuma funcionalidade de gestão está habilitada nesta etapa."/></div>;
}
