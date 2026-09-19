import type { SupabaseClient } from "@supabase/supabase-js";
import type { AssignedWorkout, Exercise, PerformanceRecord, ProgressMeasurement, ProgressPhoto, ProgressWeight, Recipe, Tip, Workout, WorkoutCheckin, WorkoutCheckinSummary, WorkoutExercise, WorkoutVideo, NutritionMeal, NutritionPlan } from "@/types/content";

export interface ContentRepository {
  listExercises(): Promise<Exercise[]>;
  listWorkouts(): Promise<Workout[]>;
  listAssignedWorkouts(): Promise<AssignedWorkout[]>;
  listAssignedWorkoutSchedule(): Promise<AssignedWorkout[]>;
  getWorkout(id: string): Promise<Workout | null>;
  listWorkoutExercises(workoutId: string): Promise<WorkoutExercise[]>;
  listVideos(): Promise<WorkoutVideo[]>;
  getVideo(id: string): Promise<WorkoutVideo | null>;
  getExercise(id: string): Promise<Exercise | null>;
  listTips(): Promise<Tip[]>;
  listNutritionPlans(): Promise<NutritionPlan[]>;
  listNutritionMeals(planId: string): Promise<NutritionMeal[]>;
  listRecipes(): Promise<Recipe[]>;
  listProgressWeights(): Promise<ProgressWeight[]>;
  listProgressMeasurements(): Promise<ProgressMeasurement[]>;
  listPerformanceRecords(): Promise<PerformanceRecord[]>;
  getTodayWorkoutCheckin(assignmentId: string): Promise<WorkoutCheckin | null>;
  getWorkoutCheckinSummary(): Promise<WorkoutCheckinSummary>;
  listProgressPhotos(): Promise<ProgressPhoto[]>;
}

type ContentRow = Record<string, unknown>;
type AssignmentScheduleRow = { weekday: number; schedule_kind: string };

export const saoPauloDate = () => {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(new Date());
  const value = (kind: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === kind)?.value;
  return `${value("year")}-${value("month")}-${value("day")}`;
};

// Assignment schedules use Monday = 0 through Sunday = 6. Derive the weekday
// from the already time-zone-aware calendar date instead of the server's UTC
// clock, which can otherwise select the wrong schedule around midnight.
export const saoPauloWeekday = () => (new Date(`${saoPauloDate()}T12:00:00Z`).getUTCDay() + 6) % 7;

const saoPauloWeekStart = () => {
  const today = saoPauloDate();
  const weekday = saoPauloWeekday();
  const monday = new Date(`${today}T12:00:00Z`);
  monday.setUTCDate(monday.getUTCDate() - weekday);
  return monday.toISOString().slice(0, 10);
};

export const isScheduledWorkout = (schedule: AssignmentScheduleRow[] | null | undefined, weekday: number) =>
  (schedule ?? []).some((item) => item.weekday === weekday && item.schedule_kind === "WORKOUT");

export const workoutScheduleDays = (schedule: AssignmentScheduleRow[] | null | undefined) =>
  [...new Set((schedule ?? [])
    .filter((item) => item.schedule_kind === "WORKOUT" && Number.isInteger(item.weekday) && item.weekday >= 0 && item.weekday <= 6)
    .map((item) => item.weekday))]
    .sort((left, right) => left - right);

const scoped = (row: ContentRow) => ({
  scope: row.scope as Exercise["scope"],
  clientId: (row.client_id as string | null) ?? null,
});

const toExercise = (row: ContentRow, thumbnailUrl: string | null = null): Exercise => ({
  ...scoped(row), id: row.id as string, name: row.name as string, slug: row.slug as string,
  description: (row.description as string | null) ?? null, instructions: (row.instructions as string | null) ?? null,
  muscles: (row.muscles as string[]) ?? [], difficulty: (row.level as string | null) ?? null,
  equipment: (row.equipment as string | null) ?? null, category: ((row.category as ContentRow | null)?.name as string | null) ?? null,
  thumbnailUrl, videoId: (row.video_id as string | null) ?? null,
  isActive: row.is_active as boolean, createdAt: row.created_at as string, updatedAt: row.updated_at as string,
});

const toWorkout = (row: ContentRow): Workout => ({
  ...scoped(row), id: row.id as string, name: row.name as string, slug: row.slug as string,
  description: (row.description as string | null) ?? null, category: (row.category as string | null) ?? null,
  durationMinutes: (row.duration_minutes as number | null) ?? null, level: (row.level as string | null) ?? null,
  coverAssetId: (row.cover_asset_id as string | null) ?? null, isActive: row.is_active as boolean,
  createdAt: row.created_at as string, updatedAt: row.updated_at as string,
});

const toVideo = (row: ContentRow): WorkoutVideo => ({
  ...scoped(row), id: row.id as string, provider: row.provider as WorkoutVideo["provider"],
  providerVideoId: row.provider_video_id as string, title: row.title as string,
  thumbnailUrl: (row.thumbnail_url as string | null) ?? null, durationSeconds: (row.duration_seconds as number | null) ?? null,
  type: (row.type as string | null) ?? null, isActive: row.is_active as boolean,
});

const toWorkoutCheckin = (row: ContentRow): WorkoutCheckin => ({
  id: String(row.id),
  assignmentId: String(row.assignment_id),
  workoutId: String(row.workout_id),
  workoutName: ((row.workout as ContentRow | null)?.name as string | null) ?? null,
  completedDate: String(row.completed_date),
  completedAt: String(row.completed_at),
});

export function createContentRepository(client: SupabaseClient, resolveOwner?: () => Promise<string>): ContentRepository {
  let ownerPromise: Promise<string> | undefined;
  const ownClientId = () => ownerPromise ??= (async () => {
    if (resolveOwner) return resolveOwner();
    const { data, error } = await client.auth.getUser();
    if (error || !data.user) throw error ?? new Error("Sessão não disponível.");
    const owner = await client.from("clients").select("id").eq("user_id", data.user.id).single();
    if (owner.error) throw owner.error;
    return owner.data.id as string;
  })();
  const contentScope = async () => `scope.eq.GLOBAL,and(scope.eq.CLIENT,client_id.eq.${await ownClientId()})`;
  // These maps live only in this repository/request, including failures.
  const signedAssets = new Map<string, Promise<string | null>>();
  const workouts = new Map<string, Promise<Workout | null>>();
  const signedAssetUrl = (asset: ContentRow | null | undefined): Promise<string | null> => {
    if (!asset?.bucket || !asset.path) return Promise.resolve(null);
    const key = JSON.stringify([asset.bucket, asset.path]);
    if (!signedAssets.has(key)) signedAssets.set(key, (async () => {
    const { data, error } = await client.storage.from(asset.bucket as string).createSignedUrl(asset.path as string, 3600);
    if (error) throw error;
    return data?.signedUrl ?? null;
    })());
    return signedAssets.get(key)!;
  };
  const getWorkout = (id: string) => {
    if (!workouts.has(id)) workouts.set(id, (async () => {
      const { data, error } = await client.from("workouts").select("*").eq("id", id).eq("is_active", true).maybeSingle();
      if (error) throw error;
      return data ? toWorkout(data as ContentRow) : null;
    })());
    return workouts.get(id)!;
  };
  return {
    async listExercises() {
      const { data, error } = await client.from("exercises").select("*, category:exercise_categories(name), thumbnail_asset:media_assets(bucket,path)").or(await contentScope()).eq("is_active", true).order("name");
      if (error) throw error;
      return Promise.all(((data ?? []) as ContentRow[]).map(async (row) => toExercise(
        row,
        await signedAssetUrl(row.thumbnail_asset as ContentRow | null),
      )));
    },
    async listWorkouts() {
      const { data, error } = await client.from("workouts").select("*, cover_asset:media_assets(bucket,path)").eq("scope", "GLOBAL").eq("is_active", true).eq("status", "published").order("name");
      if (error) throw error;
      return Promise.all(((data ?? []) as ContentRow[]).map(async (row) => ({ ...toWorkout(row), coverUrl: await signedAssetUrl(row.cover_asset as ContentRow | null) })));
    },
    async listAssignedWorkoutSchedule() {
      const owner = await ownClientId();
      const today = saoPauloDate();
      const { data, error } = await client
        .from("workout_assignments")
        .select("id,workout:workouts(*,cover_asset:media_assets(bucket,path)),schedule:workout_assignment_schedule(weekday,schedule_kind)")
        .eq("client_id", owner)
        .eq("is_active", true)
        .lte("starts_on", today)
        .or("ends_on.is.null,ends_on.gte." + today)
        .order("starts_on", { ascending: false })
        .order("created_at", { ascending: false })
        .order("id", { ascending: false });
      if (error) throw error;
      const rows = (data ?? []) as ContentRow[];
      return Promise.all(rows.flatMap((assignment) => {
        const workout = assignment.workout as ContentRow | null;
        const scheduledWeekdays = workoutScheduleDays(assignment.schedule as AssignmentScheduleRow[] | null);
        if (!workout || workout.is_active !== true || !scheduledWeekdays.length) return [];
        return [{
          ...toWorkout(workout),
          assignmentId: String(assignment.id),
          scheduledWeekdays,
          coverUrl: signedAssetUrl(workout.cover_asset as ContentRow | null),
        }];
      }).map(async (assigned) => ({ ...assigned, coverUrl: await assigned.coverUrl })));
    },
    async listAssignedWorkouts() {
      const weekday = saoPauloWeekday();
      const scheduled = await this.listAssignedWorkoutSchedule();
      const unique = [...new Map(scheduled
        .filter((workout) => workout.scheduledWeekdays.includes(weekday))
        .map((workout) => [workout.id, workout]))
        .values()];
      return unique;
    },
    getWorkout,
    async listWorkoutExercises(workoutId) {
      if (!await getWorkout(workoutId)) return [];
      const { data, error } = await client.from("workout_exercises").select("*, exercise:exercises(name,thumbnail_asset:media_assets(bucket,path))").eq("workout_id", workoutId).order("position");
      if (error) throw error;
      return Promise.all(((data ?? []) as ContentRow[]).map(async (row) => {
        const exercise = row.exercise as ContentRow | null;
        return {
        id: row.id as string, workoutId: row.workout_id as string, exerciseId: row.exercise_id as string,
        videoId: (row.video_id as string | null) ?? null, position: row.position as number,
        sets: (row.sets as number | null) ?? null, repetitions: (row.repetitions as string | null) ?? null,
        load: (row.load as string | null) ?? null, restSeconds: (row.rest_seconds as number | null) ?? null,
        durationSeconds: (row.duration_seconds as number | null) ?? null, notes: (row.notes as string | null) ?? null,
        exerciseName: exercise?.name as string | undefined,
        exerciseThumbnailUrl: await signedAssetUrl(exercise?.thumbnail_asset as ContentRow | null),
      };
      }));
    },
    async listVideos() {
      const { data, error } = await client.from("videos").select("*").or(await contentScope()).eq("is_active", true).order("title");
      if (error) throw error;
      return ((data ?? []) as ContentRow[]).map(toVideo);
    },
    async getVideo(id) {
      const { data, error } = await client.from("videos").select("*").or(await contentScope()).eq("id", id).eq("is_active", true).maybeSingle();
      if (error) throw error;
      return data ? toVideo(data as ContentRow) : null;
    },
    async getExercise(id) {
      const { data, error } = await client.from("exercises").select("*, category:exercise_categories(name), thumbnail_asset:media_assets(bucket,path)").or(await contentScope()).eq("id", id).eq("is_active", true).maybeSingle();
      if (error) throw error;
      return data
        ? toExercise(
            data as ContentRow,
            await signedAssetUrl((data as ContentRow).thumbnail_asset as ContentRow | null),
          )
        : null;
    },
    async listNutritionPlans() {
      const { data, error } = await client.from("nutrition_plans").select("*").eq("is_active", true).order("name");
      if (error) throw error;
      return ((data ?? []) as ContentRow[]).map((row) => ({ ...scoped(row), id: row.id as string, name: row.name as string, description: (row.description as string | null) ?? null, objective: (row.objective as string | null) ?? null, notes: (row.notes as string | null) ?? null, isActive: row.is_active !== false, createdAt: row.created_at as string }));
    },
    async listNutritionMeals(planId) {
      const { data, error } = await client.from("nutrition_meals").select("*,recipe:recipes(id,name),items:nutrition_meal_items(id,food_name,quantity,unit,notes,item_order)").eq("nutrition_plan_id", planId).order("meal_time").order("meal_order");
      if (error) throw error;
      return ((data ?? []) as ContentRow[]).map((row) => { const recipe = row.recipe as ContentRow | null; const items = Array.isArray(row.items) ? row.items as ContentRow[] : []; return { ...scoped(row), id: row.id as string, nutritionPlanId: row.nutrition_plan_id as string, name: row.name as string, mealOrder: row.meal_order as number, mealTime: (row.meal_time as string | null) ?? null, description: (row.description as string | null) ?? null, guidance: (row.guidance as string | null) ?? null, recipeId: (row.recipe_id as string | null) ?? null, recipeName: (recipe?.name as string | null) ?? null, items: items.sort((left, right) => Number(left.item_order) - Number(right.item_order)).map((item) => ({ id: String(item.id), foodName: String(item.food_name), quantity: item.quantity == null ? null : Number(item.quantity), unit: (item.unit as string | null) ?? null, notes: (item.notes as string | null) ?? null, itemOrder: Number(item.item_order) })) }; });
    },
    async listRecipes() {
      const { data, error } = await client.from("recipes").select("id,name,description,ingredients,instructions,recipe_ingredients(name,quantity,ingredient_order)").or(await contentScope()).order("name");
      if (error) throw error;
      return ((data ?? []) as ContentRow[]).map((row) => ({ id: row.id as string, name: row.name as string, description: (row.description as string | null) ?? null, ingredients: Array.isArray(row.recipe_ingredients) && row.recipe_ingredients.length ? (row.recipe_ingredients as { name: string; quantity?: string; ingredient_order: number }[]).sort((a,b) => a.ingredient_order - b.ingredient_order).map(({ name, quantity }) => ({ name, quantity })) : Array.isArray(row.ingredients) ? row.ingredients as Recipe["ingredients"] : [], instructions: (row.instructions as string | null) ?? null }));
    },
    async listProgressWeights() {
      const { data, error } = await client.from("progress_weights").select("id,value,recorded_at").eq("client_id", await ownClientId()).order("recorded_at", { ascending: false }); if (error) throw error;
      return ((data ?? []) as ContentRow[]).map((row) => ({ id: row.id as string, value: Number(row.value), recordedAt: row.recorded_at as string }));
    },
    async listProgressMeasurements() {
      const { data, error } = await client.from("progress_measurements").select("id,measurements,recorded_at").eq("client_id", await ownClientId()).order("recorded_at", { ascending: false }); if (error) throw error;
      return ((data ?? []) as ContentRow[]).map((row) => ({ id: row.id as string, measurements: (row.measurements as Record<string, unknown>) ?? {}, recordedAt: row.recorded_at as string }));
    },
    async listPerformanceRecords() {
      const { data, error } = await client.from("performance_records").select("id,metric,value,unit,recorded_at").eq("client_id", await ownClientId()).order("recorded_at", { ascending: false }); if (error) throw error;
      return ((data ?? []) as ContentRow[]).map((row) => ({ id: row.id as string, metric: row.metric as string, value: row.value == null ? null : Number(row.value), unit: (row.unit as string | null) ?? null, recordedAt: row.recorded_at as string }));
    },
    async getTodayWorkoutCheckin(assignmentId) {
      const { data, error } = await client
        .from("workout_checkins")
        .select("id,assignment_id,workout_id,completed_date,completed_at,workout:workouts(name)")
        .eq("client_id", await ownClientId())
        .eq("assignment_id", assignmentId)
        .eq("completed_date", saoPauloDate())
        .maybeSingle();
      if (error) throw error;
      return data ? toWorkoutCheckin(data as ContentRow) : null;
    },
    async getWorkoutCheckinSummary() {
      const owner = await ownClientId();
      const [totalResult, weekResult, recentResult] = await Promise.all([
        client.from("workout_checkins").select("id", { count: "exact", head: true }).eq("client_id", owner),
        client.from("workout_checkins").select("id", { count: "exact", head: true }).eq("client_id", owner).gte("completed_date", saoPauloWeekStart()),
        client.from("workout_checkins").select("id,assignment_id,workout_id,completed_date,completed_at,workout:workouts(name)").eq("client_id", owner).order("completed_at", { ascending: false }).limit(12),
      ]);
      if (totalResult.error) throw totalResult.error;
      if (weekResult.error) throw weekResult.error;
      if (recentResult.error) throw recentResult.error;
      const recent = ((recentResult.data ?? []) as ContentRow[]).map(toWorkoutCheckin);
      return { total: totalResult.count ?? 0, thisWeek: weekResult.count ?? 0, last: recent[0] ?? null, recent };
    },
    async listProgressPhotos() {
      const { data, error } = await client.from("progress_photos").select("id,asset_id,category,recorded_at, asset:media_assets(bucket,path)").eq("client_id", await ownClientId()).order("recorded_at", { ascending: false });
      if (error) throw error;
      return Promise.all(((data ?? []) as ContentRow[]).map(async (row) => ({ id: row.id as string, assetId: (row.asset_id as string | null) ?? null, category: (row.category as string | null) ?? null, recordedAt: row.recorded_at as string, imageUrl: await signedAssetUrl(row.asset as ContentRow | null) })));
    },
    async listTips() {
      const { data, error } = await client.from("tips").select("*, category:tip_categories(name), image_asset:media_assets(bucket,path)").or(await contentScope()).eq("is_active", true).order("title");
      if (error) throw error;
      return Promise.all(((data ?? []) as ContentRow[]).map(async (row) => ({
        ...scoped(row), id: row.id as string, title: row.title as string, slug: row.slug as string,
        summary: (row.summary as string | null) ?? null, content: row.content as string,
        categoryName: (row.category as ContentRow | null)?.name as string | null, categoryId: (row.category_id as string | null) ?? null, imageAssetId: (row.image_asset_id as string | null) ?? null,
        isActive: row.is_active as boolean, imageUrl: await signedAssetUrl(row.image_asset as ContentRow | null),
      })));
    },
  };
}
