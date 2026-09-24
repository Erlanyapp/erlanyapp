import type { ContentScope } from "./content";

export type EditorialClient = { id: string; name: string; email: string | null; avatarUrl: string | null };

export type AdminTip = {
  id: string; title: string; slug: string; summary: string | null; content: string;
  categoryId: string | null; categoryName: string | null; scope: ContentScope; clientId: string | null;
  clientName: string | null; isActive: boolean; imageAssetId: string | null; imagePath: string | null; imageUrl: string | null;
  createdAt: string; updatedAt: string;
};

export type AdminRecipeIngredient = { id?: string; name: string; quantity: string | null; unit: string | null; notes: string | null; ingredientOrder: number };

export type AdminRecipe = {
  id: string; name: string; slug: string; description: string | null; instructions: string | null;
  scope: ContentScope; clientId: string | null; clientName: string | null; isActive: boolean;
  imageAssetId: string | null; imagePath: string | null; imageUrl: string | null; createdAt: string; updatedAt: string;
  ingredients: AdminRecipeIngredient[];
};

export type TipInput = { title: string; slug: string; summary: string | null; content: string; categoryId: string | null; scope: ContentScope; clientId: string | null; isActive: boolean };
export type RecipeInput = { name: string; slug: string; description: string | null; instructions: string | null; scope: ContentScope; clientId: string | null; isActive: boolean; ingredients: AdminRecipeIngredient[] };
