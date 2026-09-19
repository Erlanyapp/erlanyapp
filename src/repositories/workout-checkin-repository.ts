import type { SupabaseClient } from "@supabase/supabase-js";

export function createWorkoutCheckinRepository(client: SupabaseClient, resolveOwner: () => Promise<string>) {
  return {
    async create(assignmentId: string, workoutId: string) {
      const { error } = await client.from("workout_checkins").insert({
        client_id: await resolveOwner(),
        assignment_id: assignmentId,
        workout_id: workoutId,
      });
      if (error && error.code !== "23505") throw error;
      return { alreadyCheckedIn: error?.code === "23505" };
    },
  };
}
