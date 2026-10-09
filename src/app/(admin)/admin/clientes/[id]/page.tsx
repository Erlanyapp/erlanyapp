import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/supabase/admin";
import { createAdminService } from "@/services/admin-service";
import { createAdminProgressService } from "@/services/admin-progress-service";
import { adminClientId,clientTab,type AdminSearchParams } from "@/domain/admin-client";
import { AdminClientDetailView } from "@/components/admin/client-detail";
export default async function AdminClientDetailPage({params,searchParams}:{params:Promise<{id:string}>;searchParams:Promise<AdminSearchParams>}) {
  const {id}=await params,query=await searchParams,{client,user}=await requireAdmin();
  try {adminClientId(id);}catch {notFound();}
  const service=createAdminService(client),tab=clientTab(query.aba);
  const item=await service.getClient(id);if(!item)notFound();
  const records=tab==="perfil"||tab==="visao-geral"||tab==="evolucao"?null:await service.getRecords(id,tab,query.registros);
  const progress=tab==="evolucao"?await createAdminProgressService(client,user.id).list(id):null;
  return <AdminClientDetailView item={item} tab={tab} records={records} progress={progress}/>;
}
