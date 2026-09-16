import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/supabase/admin";
import { createAdminService } from "@/services/admin-service";
import { adminClientId,clientTab,type AdminSearchParams } from "@/domain/admin-client";
import { AdminClientDetailView } from "@/components/admin/client-detail";
export default async function AdminClientDetailPage({params,searchParams}:{params:Promise<{id:string}>;searchParams:Promise<AdminSearchParams>}) {
  const {id}=await params,query=await searchParams,{client}=await requireAdmin();
  try {adminClientId(id);}catch {notFound();}
  const item=await createAdminService(client).getClient(id);if(!item)notFound();
  return <AdminClientDetailView item={item} tab={clientTab(query.aba)}/>;
}
