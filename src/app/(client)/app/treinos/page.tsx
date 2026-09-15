import { PageHeader, EmptyState } from "@/components/ui";
import { WorkoutCard, TabNavigation } from "@/components/client/client-components";
import { ContentError } from "@/components/client/content-states";
import { getContentService } from "@/services/server-content";

export default async function WorkoutsPage() {
  const service = await getContentService();
  if (!service) return <div><PageHeader title="Treinos" /><ContentError label="seus treinos" /></div>;
  try {
    const workouts = await service.listWorkouts();
    return <div><PageHeader title="Treinos" /><TabNavigation tabs={["Todos", "Meus treinos"]} selected="Todos" /><div className="workout-list">{workouts.length ? workouts.map((workout) => <WorkoutCard workout={workout} key={workout.id} />) : <EmptyState title="Nenhum treino disponível" description="Seus treinos aparecerão aqui quando forem liberados." />}</div></div>;
  } catch { return <div><PageHeader title="Treinos" /><ContentError label="seus treinos" /></div>; }
}
