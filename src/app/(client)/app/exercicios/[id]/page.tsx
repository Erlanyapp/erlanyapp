import Link from "next/link";
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
    const exercise = await service.getExercise(id);
    if (!exercise) return <div><PageHeader title="Exercício" back backHref={backHref} /><EmptyState title="Exercício não encontrado" description="Este exercício não está disponível para o seu perfil." /></div>;
    const workout = workoutId && /^[0-9a-f-]{36}$/i.test(workoutId) ? await service.getWorkout(workoutId) : null;
    if (workout) backHref = `/app/treinos/${workout.id}`;
    const items = workout ? await service.listWorkoutExercises(workout.id) : [];
    const item = items.find(item => item.exerciseId === exercise.id);
    const videoId = item?.videoId || exercise.videoId;
    const video = videoId ? (await service.listVideos()).find(video => video.id === videoId) : null;
    return <div><PageHeader title={exercise.name} back backHref={backHref} /><div className="detail-meta"><span>{exercise.category ?? "Exercício"}</span>{exercise.difficulty && <span>{exercise.difficulty}</span>}{exercise.equipment && <span>{exercise.equipment}</span>}</div>{item && <dl className="card account-panel account-data">{item.sets != null && <div><dt>Séries</dt><dd>{item.sets}</dd></div>}{item.repetitions && <div><dt>Repetições</dt><dd>{item.repetitions}</dd></div>}{item.restSeconds != null && <div><dt>Descanso</dt><dd>{item.restSeconds}s</dd></div>}{item.notes && <div><dt>Orientação do treino</dt><dd>{item.notes}</dd></div>}</dl>}<VideoPlayer video={video} /><p className="muted">{exercise.description ?? "Prepare-se para evoluir com segurança."}</p><Card><p className="eyebrow">INSTRUÇÕES</p><p>{exercise.instructions ?? "Siga a orientação do seu profissional."}</p>{exercise.muscles.length > 0 && <small>Músculos: {exercise.muscles.join(", ")}</small>}</Card><Link className="button button-primary full-width exercise-cta" href={backHref}>Voltar ao treino</Link></div>;
  } catch { return <div><PageHeader title="Exercício" back backHref={backHref} /><ContentError label="este exercício" /></div>; }
}
