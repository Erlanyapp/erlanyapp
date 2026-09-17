import Link from "next/link";
import { AppIcon } from "@/components/icons";
import { Card, EmptyState, PageHeader } from "@/components/ui";
import { VideoPlayer } from "@/components/client/client-components";
import { ContentError } from "@/components/client/content-states";
import { getContentService } from "@/services/server-content";

export default async function ExerciseDetailPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ workout?: string }> }) {
  const { id } = await params;
  const { workout: workoutId } = await searchParams;
  let backHref = "/app/treinos";
  const service = await getContentService();
  if (!service) return <div><PageHeader title="Exercício" back backHref={backHref} /><ContentError label="este exercício" /></div>;
  try {
    const [exercise, workout] = await Promise.all([
      service.getExercise(id),
      workoutId && /^[0-9a-f-]{36}$/i.test(workoutId) ? service.getWorkout(workoutId) : Promise.resolve(null),
    ]);
    if (!exercise) return <div><PageHeader title="Exercício" back backHref={backHref} /><EmptyState title="Exercício não encontrado" description="Este exercício não está disponível para o seu perfil." /></div>;
    if (workout) backHref = `/app/treinos/${workout.id}`;
    const items = workout ? await service.listWorkoutExercises(workout.id) : [];
    const item = items.find(item => item.exerciseId === exercise.id);
    const videoId = item?.videoId || exercise.videoId;
    const video = videoId ? await service.getVideo(videoId) : null;
    return <div className="exercise-reference-page">
      <PageHeader title={exercise.name} back backHref={backHref} />
      <VideoPlayer video={video} />
      <h2 className="exercise-name">{exercise.name}</h2>
      <p className="exercise-description">{exercise.description ?? "Prepare-se para evoluir com segurança."}</p>
      {item && <dl className="exercise-prescription">
        {item.sets != null && <div><dt>Séries</dt><dd>{item.sets}</dd></div>}
        {item.repetitions && <div><dt>Repetições</dt><dd>{item.repetitions}</dd></div>}
        {item.restSeconds != null && <div><dt>Descanso</dt><dd>{item.restSeconds}s</dd></div>}
      </dl>}
      <Card className="exercise-instructions"><AppIcon name="tips" size={24} /><div><h3>Orientações</h3><p>{exercise.instructions ?? "Siga a orientação do seu profissional."}</p>{item?.notes && <p>{item.notes}</p>}{exercise.muscles.length > 0 && <small>Músculos: {exercise.muscles.join(", ")}</small>}</div></Card>
      <div className="detail-meta"><span>{exercise.category ?? "Exercício"}</span>{exercise.difficulty && <span>{exercise.difficulty}</span>}{exercise.equipment && <span>{exercise.equipment}</span>}</div>
      <Link className="button button-primary full-width exercise-cta" href={backHref}>Voltar ao treino</Link>
    </div>;
  } catch { return <div><PageHeader title="Exercício" back backHref={backHref} /><ContentError label="este exercício" /></div>; }
}
