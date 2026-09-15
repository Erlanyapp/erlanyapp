import type { SupabaseClient } from "@supabase/supabase-js";
import type { Exercise, Tip, Workout, WorkoutVideo } from "@/types/content";

export interface ContentRepository {
  listExercises(): Promise<Exercise[]>;
  listWorkouts(): Promise<Workout[]>;
  listVideos(): Promise<WorkoutVideo[]>;
  listTips(): Promise<Tip[]>;
}

type ContentRow = Record<string, unknown>;

const scoped = (row: ContentRow) => ({
  scope: row.scope as Exercise["scope"],
  clientId: (row.client_id as string | null) ?? null,
});

export function createContentRepository(client: SupabaseClient): ContentRepository {
  return {
    async listExercises() {
      const { data, error } = await client.from("exercises").select("*").eq("is_active", true).order("name");
      if (error) throw error;
      return ((data ?? []) as ContentRow[]).map((row) => ({
        ...scoped(row), id: row.id as string, name: row.name as string, slug: row.slug as string,
        description: (row.description as string | null) ?? null, instructions: (row.instructions as string | null) ?? null,
        muscles: (row.muscles as string[]) ?? [], difficulty: (row.level as string | null) ?? null,
        thumbnailUrl: (row.thumbnail_url as string | null) ?? null, videoId: null, isActive: row.is_active as boolean,
        createdAt: row.created_at as string, updatedAt: row.updated_at as string,
      }));
    },
    async listWorkouts() {
      const { data, error } = await client.from("workouts").select("*").eq("is_active", true).order("name");
      if (error) throw error;
      return ((data ?? []) as ContentRow[]).map((row) => ({
        ...scoped(row), id: row.id as string, name: row.name as string, slug: row.slug as string,
        description: (row.description as string | null) ?? null, category: (row.category as string | null) ?? null,
        durationMinutes: (row.duration_minutes as number | null) ?? null, level: (row.level as string | null) ?? null,
        coverAssetId: (row.cover_asset_id as string | null) ?? null, isActive: row.is_active as boolean,
        createdAt: row.created_at as string, updatedAt: row.updated_at as string,
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
