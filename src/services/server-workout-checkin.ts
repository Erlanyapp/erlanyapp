import "server-only";
import { getClientIdentity, getOwnClientId } from "@/services/server-client-context";
import { createWorkoutCheckinRepository } from "@/repositories/workout-checkin-repository";
import { createWorkoutCheckinService } from "@/services/workout-checkin-service";

export async function getWorkoutCheckinService() {
  const identity = await getClientIdentity();
  if (!identity) throw new Error("Supabase não está configurado neste ambiente.");
  return createWorkoutCheckinService(createWorkoutCheckinRepository(identity.client, getOwnClientId));
}
