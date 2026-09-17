import { WorkoutEditor } from "@/components/admin/workout-editor";import { requireAdmin } from "@/lib/supabase/admin";import { createAdminWorkoutService } from "@/services/admin-workout-service";
export default async function NewWorkout(){const s=createAdminWorkoutService((await requireAdmin()).client),clients=await s.clients();return <WorkoutEditor clients={clients} />;}
