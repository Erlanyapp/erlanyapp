import Link from "next/link";
import { notFound } from "next/navigation";

import { WorkoutEditor } from "@/components/admin/workout-editor";
import { WorkoutWorkspace, type WorkoutAssignmentEntry, type WorkoutExerciseEntry } from "@/components/admin/workout-workspace";
import { requireAdmin } from "@/lib/supabase/admin";
import { createAdminWorkoutService } from "@/services/admin-workout-service";

export default async function WorkoutDetail({ params }: { params: Promise<{ id: string }> }) {
  const workoutId = (await params).id;
  const service = createAdminWorkoutService((await requireAdmin()).client);
  const [item, clients, exercises, assignments] = await Promise.all([
    service.get(workoutId),
    service.clients(),
    service.exercises(),
    service.assignments(workoutId),
  ]);

  if (!item) notFound();

  const composition = ((item.workout_exercises ?? []) as WorkoutExerciseEntry[])
    .toSorted((left, right) => left.position - right.position);

  return <div className="workout-detail-page">
    <Link className="admin-back" href="/admin/treinos">Voltar para treinos</Link>
    <WorkoutEditor item={item} clients={clients} />
    <WorkoutWorkspace
      workoutId={workoutId}
      composition={composition}
      exercises={exercises}
      assignments={assignments as WorkoutAssignmentEntry[]}
      clients={clients}
    />
  </div>;
}
