import Image from "next/image";
import Link from "next/link";
import { EmptyState, PageHeader } from "@/components/ui";
import { TabNavigation, WorkoutCard } from "@/components/client/client-components";
import { ContentError } from "@/components/client/content-states";
import { AppIcon } from "@/components/icons";
import { getContentService } from "@/services/server-content";

export default async function WorkoutsPage({ searchParams }: { searchParams: Promise<{ tab?: string; category?: string; q?: string }> }) {
  const filters = await searchParams;
  const tab = filters.tab === "Meus treinos" ? "Meus treinos" : "Categorias";
  const service = await getContentService();
  if (!service) return <><PageHeader title="Treinos" back /><ContentError label="seus treinos" /></>;
  try {
    const [global,assigned] = await Promise.all([service.listWorkouts(),service.listAssignedWorkouts()]);
    const all=[...global,...assigned.filter(item=>!global.some(globalItem=>globalItem.id===item.id))];
    const categories = [...new Set(all.map(item => item.category).filter((item): item is string => !!item))];
    const workouts = all.filter(item => (tab !== "Meus treinos" || assigned.some(assignedItem=>assignedItem.id===item.id)||item.scope === "CLIENT")
      && (!filters.category || item.category === filters.category)
      && (!filters.q || item.name.toLocaleLowerCase("pt-BR").includes(filters.q.trim().toLocaleLowerCase("pt-BR"))));
    const showCategories = tab === "Categorias" && !filters.category && !filters.q && categories.length > 0;
    return <div><PageHeader title="Treinos" back /><TabNavigation tabs={["Categorias", "Meus treinos"]} selected={tab} basePath="/app/treinos" />
      <details className="workout-filter-details" open={!!filters.q || !!filters.category}><summary>Buscar e filtrar<AppIcon name="settings" size={18} /></summary>
        <form className="client-filters" action="/app/treinos"><input type="hidden" name="tab" value={tab} /><label>Buscar treino<input name="q" defaultValue={filters.q ?? ""} placeholder="Nome do treino" maxLength={100} /></label><label>Categoria<select name="category" defaultValue={filters.category ?? ""}><option value="">Todas</option>{categories.map(category => <option key={category}>{category}</option>)}</select></label><button className="button button-outline" type="submit">Filtrar</button></form>
      </details>
      {showCategories ? <div className="workout-category-list">{categories.map(category => {
        const items = all.filter(item => item.category === category);
        const cover = items.find(item => !!item.coverUrl)?.coverUrl;
        return <Link className="card workout-category-row" href={`/app/treinos?tab=Categorias&category=${encodeURIComponent(category)}`} key={category}>
          <span className="workout-category-image">{cover ? <Image src={cover} alt="" fill sizes="64px" unoptimized /> : <AppIcon name="workout" size={28} />}</span>
          <span><strong>{category}</strong><small>{items.length} {items.length === 1 ? "treino disponível" : "treinos disponíveis"}</small></span><AppIcon name="arrow-right" size={18} />
        </Link>;
      })}</div> : <div className="workout-list">{workouts.length ? workouts.map(workout => <WorkoutCard workout={workout} key={workout.id} />) : <EmptyState title="Nenhum treino disponível" description={tab === "Meus treinos" ? "Seus treinos atribuídos aparecerão aqui quando forem liberados." : filters.q || filters.category ? "Nenhum treino corresponde aos filtros selecionados." : "Os treinos e suas categorias aparecerão aqui quando forem liberados."} />}</div>}
    </div>;
  } catch { return <><PageHeader title="Treinos" back /><ContentError label="seus treinos" /></>; }
}
