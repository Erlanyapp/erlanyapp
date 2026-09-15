import type { SupabaseClient } from "@supabase/supabase-js";
import type { Exercise, ProgressPhoto, Tip, Workout, WorkoutExercise, WorkoutVideo, NutritionPlan } from "@/types/content";

export interface ContentRepository {
  listExercises(): Promise<Exercise[]>;
  listWorkouts(): Promise<Workout[]>;
  getWorkout(id: string): Promise<Workout | null>;
  listWorkoutExercises(workoutId: string): Promise<WorkoutExercise[]>;
  listVideos(): Promise<WorkoutVideo[]>;
  getExercise(id: string): Promise<Exercise | null>;
  listTips(): Promise<Tip[]>;
  listNutritionPlans(): Promise<NutritionPlan[]>;
  listProgressPhotos(): Promise<ProgressPhoto[]>;
}

type ContentRow = Record<string, unknown>;

const scoped = (row: ContentRow) => ({
  scope: row.scope as Exercise["scope"],
  clientId: (row.client_id as string | null) ?? null,
});

const toExercise = (row: ContentRow): Exercise => ({
  ...scoped(row), id: row.id as string, name: row.name as string, slug: row.slug as string,
  description: (row.description as string | null) ?? null, instructions: (row.instructions as string | null) ?? null,
  muscles: (row.muscles as string[]) ?? [], difficulty: (row.level as string | null) ?? null,
  thumbnailUrl: (row.thumbnail_url as string | null) ?? null, videoId: (row.video_id as string | null) ?? null,
  isActive: row.is_active as boolean, createdAt: row.created_at as string, updatedAt: row.updated_at as string,
});

const toWorkout = (row: ContentRow): Workout => ({
  ...scoped(row), id: row.id as string, name: row.name as string, slug: row.slug as string,
  description: (row.description as string | null) ?? null, category: (row.category as string | null) ?? null,
  durationMinutes: (row.duration_minutes as number | null) ?? null, level: (row.level as string | null) ?? null,
  coverAssetId: (row.cover_asset_id as string | null) ?? null, isActive: row.is_active as boolean,
  createdAt: row.created_at as string, updatedAt: row.updated_at as string,
});

export function createContentRepository(client: SupabaseClient): ContentRepository {
  return {
    async listExercises() {
      const { data, error } = await client.from("exercises").select("*").eq("is_active", true).order("name");
      if (error) throw error;
      return ((data ?? []) as ContentRow[]).map(toExercise);
    },
    async listWorkouts() {
      const { data, error } = await client.from("workouts").select("*").eq("is_active", true).order("name");
      if (error) throw error;
      return ((data ?? []) as ContentRow[]).map(toWorkout);
    },
    async getWorkout(id) {
      const { data, error } = await client.from("workouts").select("*").eq("id", id).eq("is_active", true).maybeSingle();
      if (error) throw error;
      return data ? toWorkout(data as ContentRow) : null;
    },
    async listWorkoutExercises(workoutId) {
      const { data, error } = await client.from("workout_exercises").select("*").eq("workout_id", workoutId).order("position");
      if (error) throw error;
      return ((data ?? []) as ContentRow[]).map((row) => ({
        id: row.id as string, workoutId: row.workout_id as string, exerciseId: row.exercise_id as string,
        videoId: (row.video_id as string | null) ?? null, position: row.position as number,
        sets: (row.sets as number | null) ?? null, repetitions: (row.repetitions as string | null) ?? null,
        restSeconds: (row.rest_seconds as number | null) ?? null, notes: (row.notes as string | null) ?? null,
      }));
    },
    async listVideos() {
      const { data, error } = await client.from("videos").select("*").eq("is_active", true).order("title");
      if (error) throw error;
      return ((data ?? []) as ContentRow[]).map((row) => ({
        ...scoped(row), id: row.id as string, provider: row.provider as WorkoutVideo["provider"],
        providerVideoId: row.provider_video_id as string, title: row.title as string,
        thumbnailUrl: (row.thumbnail_url as string | null) ?? null, durationSeconds: (row.duration_seconds as number | null) ?? null,
        type: (row.type as string | null) ?? null, isActive: row.is_active as boolean,
      }));
    },
    async getExercise(id) {
      const { data, error } = await client.from("exercises").select("*").eq("id", id).eq("is_active", true).maybeSingle();
      if (error) throw error;
      return data ? toExercise(data as ContentRow) : null;
    },
    async listNutritionPlans() {
      const { data, error } = await client.from("nutrition_plans").select("*").order("name");
      if (error) throw error;
      return ((data ?? []) as ContentRow[]).map((row) => ({ ...scoped(row), id: row.id as string, name: row.name as string, description: (row.description as string | null) ?? null, createdAt: row.created_at as string }));
    },
    async listProgressPhotos() {
      const { data, error } = await client.from("progress_photos").select("id,asset_id,category,recorded_at").order("recorded_at", { ascending: false });
      if (error) throw error;
      return ((data ?? []) as ContentRow[]).map((row) => ({ id: row.id as string, assetId: (row.asset_id as string | null) ?? null, category: (row.category as string | null) ?? null, recordedAt: row.recorded_at as string }));
    },
    async listTips() {
      const { data, error } = await client.from("tips").select("*").eq("is_active", true).order("title");
      if (error) throw error;
      return ((data ?? []) as ContentRow[]).map((row) => ({
        ...scoped(row), id: row.id as string, title: row.title as string, slug: row.slug as string,
        summary: (row.summary as string | null) ?? null, content: row.content as string,
        categoryId: (row.category_id as string | null) ?? null, imageAssetId: (row.image_asset_id as string | null) ?? null,
        isActive: row.is_active as boolean,
      }));
    },
  };
}
