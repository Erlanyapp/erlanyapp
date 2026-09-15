export type ContentScope = "GLOBAL" | "CLIENT";

export type MediaAssetType = "workout" | "progress" | "massage" | "motivational" | "other";
export type VideoProvider = "youtube" | "vimeo" | "storage" | "other";

export interface ScopedContent {
  scope: ContentScope;
  clientId: string | null;
}

export interface Exercise extends ScopedContent {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  instructions: string | null;
  muscles: string[];
  equipment: string | null;
  category: string | null;
  difficulty: string | null;
  thumbnailUrl: string | null;
  videoId: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Workout extends ScopedContent {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  category: string | null;
  durationMinutes: number | null;
  level: string | null;
  coverAssetId: string | null;
  coverUrl?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface WorkoutExercise {
  id: string;
  workoutId: string;
  exerciseId: string;
  videoId: string | null;
  position: number;
  sets: number | null;
  repetitions: string | null;
  restSeconds: number | null;
  notes: string | null;
  exerciseName?: string;
  exerciseThumbnailUrl?: string | null;
}

export interface WorkoutVideo extends ScopedContent {
  id: string;
  provider: VideoProvider;
  providerVideoId: string;
  title: string;
  thumbnailUrl: string | null;
  durationSeconds: number | null;
  type: string | null;
  isActive: boolean;
}

export interface MediaAsset extends ScopedContent {
  id: string;
  bucket: string;
  path: string;
  title: string | null;
  altText: string | null;
  assetType: MediaAssetType;
  metadata: Record<string, unknown>;
}

export interface Tip extends ScopedContent {
  id: string;
  title: string;
  slug: string;
  summary: string | null;
  content: string;
  categoryId: string | null;
  imageAssetId: string | null;
  isActive: boolean;
  imageUrl?: string | null;
}

export interface NutritionMeal extends ScopedContent {
  id: string;
  nutritionPlanId: string;
  name: string;
  mealOrder: number;
  guidance: string | null;
  recipeId: string | null;
}

export interface NutritionPlan extends ScopedContent {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
}

export interface Recipe {
  id: string;
  name: string;
  description: string | null;
  ingredients: Array<{ name: string; quantity?: string }>;
  instructions: string | null;
}

export interface ProgressWeight { id: string; value: number; recordedAt: string; }
export interface ProgressMeasurement { id: string; measurements: Record<string, unknown>; recordedAt: string; }
export interface PerformanceRecord { id: string; metric: string; value: number | null; unit: string | null; recordedAt: string; }

export interface ProgressPhoto {
  id: string;
  assetId: string | null;
  category: string | null;
  recordedAt: string;
  imageUrl?: string | null;
}
