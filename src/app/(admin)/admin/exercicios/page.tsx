import { requireAdmin } from "@/lib/supabase/admin";
import { createAdminExerciseService } from "@/services/admin-exercise-service";
import { ExerciseLibrary } from "@/components/admin/exercise-library";
import type { ExerciseFilters } from "@/domain/admin-exercise";
export default async function ExercisesPage({searchParams}:{searchParams:Promise<ExerciseFilters>}){const p=await searchParams,{client}=await requireAdmin(),s=createAdminExerciseService(client);const [data,categories]=await Promise.all([s.list(p),s.categories()]);return <ExerciseLibrary data={data} filters={p} categories={categories}/>}
