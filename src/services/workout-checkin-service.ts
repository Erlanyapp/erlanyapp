export function createWorkoutCheckinService(repository: { create: (assignmentId: string, workoutId: string) => Promise<{ alreadyCheckedIn: boolean }> }) {
  return {
    record: (assignmentId: string, workoutId: string) => repository.create(assignmentId, workoutId),
  };
}
