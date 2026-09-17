"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/supabase/admin";
import { createAdminWorkoutService } from "@/services/admin-workout-service";
const service=async()=>createAdminWorkoutService((await requireAdmin()).client);
const refresh=(id?:string)=>{revalidatePath("/admin/treinos");if(id)revalidatePath(`/admin/treinos/${id}`);};
export async function saveWorkout(id:string|null,form:FormData){const workout=await (await service()).save(id,form);refresh(workout);redirect(`/admin/treinos/${workout}`);}
export async function toggleWorkout(id:string,active:boolean){await (await service()).toggle(id,active);refresh(id);}
export async function addWorkoutExercise(id:string,form:FormData){await (await service()).addExercise(id,form);refresh(id);}
export async function removeWorkoutExercise(workoutId:string,id:string){await (await service()).removeExercise(id);refresh(workoutId);}
export async function updateWorkoutExercise(workoutId:string,id:string,form:FormData){await (await service()).updateExercise(id,form);refresh(workoutId);}
export async function moveWorkoutExercise(workoutId:string,id:string,direction:-1|1){await (await service()).moveExercise(workoutId,id,direction);refresh(workoutId);}
export async function toggleAssignment(workoutId:string,id:string,active:boolean){await (await service()).toggleAssignment(id,active);refresh(workoutId);}
export async function cancelAssignment(workoutId:string,id:string){await (await service()).cancelAssignment(id);refresh(workoutId);}
export async function updateAssignment(workoutId:string,id:string,form:FormData){const adminWorkoutService=await service();await adminWorkoutService.updateAssignment(id,form);await adminWorkoutService.toggleAssignment(id,form.get("isActive")==="on");refresh(workoutId);}
export async function assignWorkout(id:string,form:FormData){await (await service()).assign(id,form);refresh(id);}
