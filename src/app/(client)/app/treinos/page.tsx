import { EmptyState, PageHeader } from "@/components/ui";
import { TabNavigation, WorkoutCard } from "@/components/client/client-components";
import { ContentError } from "@/components/client/content-states";
import { getContentService } from "@/services/server-content";
export default async function WorkoutsPage({ searchParams }: { searchParams: Promise<{ tab?: string; category?: string; q?: string }> }) {
  const filters = await searchParams; const tab = filters.tab === "Meus treinos" ? "Meus treinos" : "Todos";
  const service = await getContentService();
  if (!service) return <><PageHeader title="Treinos" /><ContentError label="seus treinos" /></>;
  try {
    const all = await service.listWorkouts(); const categories = [...new Set(all.map(item => item.category).filter((item): item is string => !!item))];
    const workouts = all.filter(item => (tab !== "Meus treinos" || item.scope === "CLIENT") && (!filters.category || item.category === filters.category) && (!filters.q || item.name.toLocaleLowerCase("pt-BR").includes(filters.q.trim().toLocaleLowerCase("pt-BR"))));
    return <div><PageHeader title="Treinos" /><TabNavigation tabs={["Todos","Meus treinos"]} selected={tab} basePath="/app/treinos" /><form className="client-filters" action="/app/treinos"><input type="hidden" name="tab" value={tab} /><label>Buscar treino<input name="q" defaultValue={filters.q ?? ""} placeholder="Nome do treino" maxLength={100} /></label><label>Categoria<select name="category" defaultValue={filters.category ?? ""}><option value="">Todas</option>{categories.map(category => <option key={category}>{category}</option>)}</select></label><button className="button button-outline" type="submit">Filtrar</button></form><div className="workout-list">{workouts.length ? workouts.map(workout => <WorkoutCard workout={workout} key={workout.id} />) : <EmptyState title="Nenhum treino disponível" description={tab === "Meus treinos" ? "Seus treinos atribuídos aparecerão aqui quando forem liberados." : "Nenhum treino corresponde aos filtros selecionados."} />}</div></div>;
  } catch { return <><PageHeader title="Treinos" /><ContentError label="seus treinos" /></>; }
}
