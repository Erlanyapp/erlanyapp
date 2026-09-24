import { requireAdmin } from "@/lib/supabase/admin";
import { createAdminEditorialService } from "@/services/admin-editorial-service";
import { EditorialLibrary } from "@/components/admin/editorial-library";
import type { EditorialFilters } from "@/domain/admin-editorial";

export default async function TipsPage({ searchParams }: { searchParams: Promise<EditorialFilters> }) { const params = await searchParams; const service = createAdminEditorialService((await requireAdmin()).client); try { const [data, clients, categories] = await Promise.all([service.listTips(params), service.clients(), service.tipCategories()]); return <EditorialLibrary kind="tip" data={data} filters={params} clients={clients} categories={categories} />; } catch { return <div className="admin-state"><h2>Não foi possível carregar as dicas</h2><p>Verifique a conexão e tente novamente.</p></div>; } }
