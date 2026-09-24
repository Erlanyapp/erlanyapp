import { randomUUID } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { editorialCover, editorialFilters, editorialId, recipeInput, tipInput, type EditorialFilters } from "@/domain/admin-editorial";
import { createAdminEditorialRepository } from "@/repositories/admin-editorial-repository";

export function createAdminEditorialService(client: SupabaseClient) {
  const repository = createAdminEditorialRepository(client);
  const saveTip = async (id: string | null, form: FormData) => { const input = tipInput(form); const existing = id ? await repository.getTip(id) : null; const cover = await editorialCover(form.get("cover")); const removeCover = form.get("removeCover") === "on"; let path: string | null = null; let assetId: string | null = null; try { if (cover) { path = `tips/${randomUUID()}.${cover.extension}`; await repository.uploadCover(path, cover.bytes, cover.contentType); assetId = await repository.createTipCover(path, input.title, input.scope, input.clientId); } const savedId = await repository.saveTip(id, input, cover ? assetId : removeCover ? null : undefined); if ((cover || removeCover) && existing?.imageAssetId) await repository.removeAsset(existing.imageAssetId, existing.imagePath).catch(() => undefined); return savedId; } catch (error) { if (assetId || path) await repository.removeAsset(assetId, path).catch(() => undefined); throw error; } };
  const saveRecipe = async (id: string | null, form: FormData) => { const input = recipeInput(form); const existing = id ? await repository.getRecipe(id) : null; const cover = await editorialCover(form.get("cover")); const removeCover = form.get("removeCover") === "on"; let path: string | null = null; let assetId: string | null = null; try { if (cover) { path = `recipes/${randomUUID()}.${cover.extension}`; await repository.uploadCover(path, cover.bytes, cover.contentType); assetId = await repository.createRecipeCover(path, input.name, input.scope, input.clientId); } const savedId = await repository.saveRecipe(id, input, cover ? assetId : removeCover ? null : undefined); if ((cover || removeCover) && existing?.imageAssetId) await repository.removeAsset(existing.imageAssetId, existing.imagePath).catch(() => undefined); return savedId; } catch (error) { if (assetId || path) await repository.removeAsset(assetId, path).catch(() => undefined); throw error; } };
  return {
    clients: repository.clients, tipCategories: repository.tipCategories,
    listTips: (params: EditorialFilters) => repository.listTips(editorialFilters(params)), getTip: (id: string) => repository.getTip(editorialId(id, "Dica")),
    listRecipes: (params: EditorialFilters) => repository.listRecipes(editorialFilters(params)), getRecipe: (id: string) => repository.getRecipe(editorialId(id, "Receita")),
    saveTip: (id: string | null, form: FormData) => saveTip(id ? editorialId(id, "Dica") : null, form),
    saveRecipe: (id: string | null, form: FormData) => saveRecipe(id ? editorialId(id, "Receita") : null, form),
    toggleTip: (id: string, active: boolean) => repository.toggleTip(editorialId(id, "Dica"), active),
    toggleRecipe: (id: string, active: boolean) => repository.toggleRecipe(editorialId(id, "Receita"), active),
  };
}
