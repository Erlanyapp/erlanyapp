import Link from "next/link";
import { Card, EmptyState, PageHeader } from "@/components/ui";
import { MetricCard, VideoPlayer } from "@/components/client/client-components";
import { ContentError } from "@/components/client/content-states";
import { getContentService } from "@/services/server-content";

export default async function ExerciseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const service = await getContentService();
  if (!service) return <div><PageHeader title="Exercício" back /><ContentError label="este exercício" /></div>;
  try {
    const exercise = await service.getExercise(id);
    if (!exercise) return <div><PageHeader title="Exercício" back /><EmptyState title="Exercício não encontrado" description="Este exercício não está disponível para o seu perfil." /></div>;
    return <div><PageHeader title={exercise.name} back /><div className="detail-meta"><span>{exercise.category ?? "Exercício"}</span>{exercise.difficulty && <span>{exercise.difficulty}</span>}{exercise.equipment && <span>{exercise.equipment}</span>}</div>{exercise.videoId && <VideoPlayer videoId={exercise.videoId} title={exercise.name} />}<p className="muted">{exercise.description ?? "Prepare-se para evoluir com segurança."}</p><Card><p className="eyebrow">INSTRUÇÕES</p><p>{exercise.instructions ?? "Siga a orientação do seu profissional."}</p>{exercise.muscles.length > 0 && <small>Músculos: {exercise.muscles.join(", ")}</small>}</Card><Link className="button button-primary full-width exercise-cta" href="/app/treinos">Voltar aos treinos</Link></div>;
  } catch { return <div><PageHeader title="Exercício" back /><ContentError label="este exercício" /></div>; }
}
