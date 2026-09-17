import { requireAdmin } from "@/lib/supabase/admin";
import { createAdminService } from "@/services/admin-service";
import type { AdminSearchParams } from "@/domain/admin-client";
import { AdminClientFilters,AddClientRegistration } from "@/components/admin/client-filters";
import { AdminClientTable } from "@/components/admin/client-table";
export default async function AdminClientsPage({searchParams}:{searchParams:Promise<AdminSearchParams>}) {
  const params=await searchParams,{client}=await requireAdmin(),service=createAdminService(client);
  const [result,plans]=await Promise.all([service.listClients(params),service.plans()]);
  return <div><div className="crm-page-heading"><div><p className="admin-overline">GESTÃO INDIVIDUAL</p><h2>Clientes</h2><p>Encontre clientes e acompanhe seus dados em um só lugar.</p></div><AddClientRegistration/></div><AdminClientFilters key={JSON.stringify(params)} params={params} plans={plans}/><AdminClientTable result={result} params={params}/></div>;
}
