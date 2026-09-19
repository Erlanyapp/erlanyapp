import type { ContentScope } from "./content";

export type NutritionPlanInput = { name: string; description: string | null; objective: string | null; notes: string | null; scope: ContentScope; clientId: string | null; isActive: boolean };
export type NutritionMealItemInput = { foodName: string; quantity: number | null; unit: string | null; notes: string | null; itemOrder: number };
export type NutritionMealInput = { name: string; mealTime: string | null; description: string | null; guidance: string | null; recipeId: string | null; items: NutritionMealItemInput[] };
export type NutritionAssignmentInput = { clientId: string; startsOn: string; endsOn: string | null; notes: string | null; days: number[] };
export type AdminNutritionPlan = { id: string; name: string; description: string | null; objective: string | null; notes: string | null; scope: ContentScope; clientId: string | null; isActive: boolean; mealCount: number; assignmentCount: number; updatedAt: string };
