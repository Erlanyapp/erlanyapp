import Link from "next/link";
import { EmptyState, PageHeader } from "@/components/ui";
import { ContentError } from "@/components/client/content-states";
import { getContentService } from "@/services/server-content";

export default async function WorkoutDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const service = await getContentService();
  if (!service) return <div><PageHeader title="Treino" back backHref="/app/treinos" /><ContentError label="este treino" /></div>;
  try {
    const [workout, items] = await Promise.all([service.getWorkout(id), service.listWorkoutExercises(id)]);
    if (!workout) return <div><PageHeader title="Treino" back backHref="/app/treinos" /><EmptyState title="Treino não encontrado" description="Este treino não está disponível para o seu perfil." /></div>;
    return <div><PageHeader title={workout.name} back backHref="/app/treinos" /><div className="detail-meta"><span>{workout.category ?? "Treino"}</span>{workout.level && <span>{workout.level}</span>}{workout.durationMinutes && <span>{workout.durationMinutes} min</span>}</div><p className="muted">{workout.description ?? "Seu treino personalizado"}</p>{items.length ? <div className="content-list">{items.map((item) => <Link className="card content-list-row" href={`/app/exercicios/${item.exerciseId}?workout=${workout.id}`} key={item.id}><span><strong>{item.exerciseName ?? `Exercício ${item.position + 1}`}</strong><small>{item.sets ? `${item.sets} séries` : "Detalhes do exercício"}{item.repetitions ? ` · ${item.repetitions} repetições` : ""}{item.load ? ` · ${item.load}` : ""}{item.restSeconds ? ` · ${item.restSeconds}s de descanso` : ""}{item.durationSeconds ? ` · ${item.durationSeconds}s` : ""}{item.notes ? ` · ${item.notes}` : ""}</small></span><b aria-hidden="true">›</b></Link>)}</div> : <EmptyState title="Treino sem exercícios" description="Os exercícios deste treino ainda serão liberados." />}</div>;
  } catch { return <div><PageHeader title="Treino" back backHref="/app/treinos" /><ContentError label="este treino" /></div>; }
}
