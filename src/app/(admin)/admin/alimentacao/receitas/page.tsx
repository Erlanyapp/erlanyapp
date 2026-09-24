import { requireAdmin } from "@/lib/supabase/admin";
import { createAdminEditorialService } from "@/services/admin-editorial-service";
import { EditorialLibrary } from "@/components/admin/editorial-library";
import type { EditorialFilters } from "@/domain/admin-editorial";

export default async function RecipesPage({ searchParams }: { searchParams: Promise<EditorialFilters> }) { const params = await searchParams; const service = createAdminEditorialService((await requireAdmin()).client); try { const [data, clients] = await Promise.all([service.listRecipes(params), service.clients()]); return <EditorialLibrary kind="recipe" data={data} filters={params} clients={clients} />; } catch { return <div className="admin-state"><h2>Não foi possível carregar as receitas</h2><p>Verifique a conexão e tente novamente.</p></div>; } }
