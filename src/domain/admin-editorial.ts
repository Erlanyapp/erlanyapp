import type { ContentScope } from "@/types/content";
import type { AdminRecipeIngredient, RecipeInput, TipInput } from "@/types/admin-editorial";

export const EDITORIAL_PAGE_SIZE = 20;
export type EditorialFilters = Record<string, string | string[] | undefined>;
const uuid = (value: unknown) => typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value) ? value : null;
const text = (value: FormDataEntryValue | null, limit: number) => typeof value === "string" ? value.trim().slice(0, limit) : "";
export const editorialSlug = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
const scope = (form: FormData): { scope: ContentScope; clientId: string | null } => {
  const value: ContentScope = form.get("scope") === "CLIENT" ? "CLIENT" : "GLOBAL";
  const clientId = value === "CLIENT" ? uuid(form.get("clientId")) : null;
  if (value === "CLIENT" && !clientId) throw new Error("Selecione o cliente do conteúdo privado.");
  return { scope: value, clientId };
};

export const editorialId = (value: unknown, label = "Conteúdo") => { const id = uuid(value); if (!id) throw new Error(`${label} inválido.`); return id; };
export const editorialFilters = (params: EditorialFilters) => ({
  page: typeof params.page === "string" && Number.isSafeInteger(Number(params.page)) ? Math.max(1, Math.min(100000, Number(params.page))) : 1,
  search: typeof params.q === "string" ? params.q.trim().slice(0, 100) : "",
  status: params.status === "active" || params.status === "inactive" ? params.status : "all",
  scope: params.scope === "GLOBAL" || params.scope === "CLIENT" ? params.scope : "all",
  categoryId: params.category === "all" ? null : uuid(params.category),
  clientId: params.client === "all" ? null : uuid(params.client),
});

export function tipInput(form: FormData): TipInput {
  const title = text(form.get("title"), 160); if (title.length < 2) throw new Error("Informe um título com pelo menos 2 caracteres.");
  const slug = editorialSlug(text(form.get("slug"), 180) || title); if (!slug) throw new Error("Informe um slug válido.");
  const values = scope(form); const content = text(form.get("content"), 12000); if (content.length < 2) throw new Error("Informe o conteúdo da dica.");
  return { title, slug, content, summary: text(form.get("summary"), 500) || null, categoryId: uuid(form.get("categoryId")), ...values, isActive: form.get("isActive") === "on" };
}

export function recipeInput(form: FormData): RecipeInput {
  const name = text(form.get("name"), 160); if (name.length < 2) throw new Error("Informe um nome com pelo menos 2 caracteres.");
  const slug = editorialSlug(text(form.get("slug"), 180) || name); if (!slug) throw new Error("Informe um slug válido.");
  const values = scope(form); const names = form.getAll("ingredientName"), quantities = form.getAll("ingredientQuantity"), units = form.getAll("ingredientUnit"), notes = form.getAll("ingredientNotes");
  const ingredients: AdminRecipeIngredient[] = names.map((value, index) => ({ name: typeof value === "string" ? value.trim().slice(0, 180) : "", quantity: typeof quantities[index] === "string" ? quantities[index].trim().slice(0, 80) || null : null, unit: typeof units[index] === "string" ? units[index].trim().slice(0, 40) || null : null, notes: typeof notes[index] === "string" ? notes[index].trim().slice(0, 500) || null : null, ingredientOrder: index })).filter((item) => item.name);
  if (!ingredients.length) throw new Error("Adicione pelo menos um ingrediente.");
  return { name, slug, description: text(form.get("description"), 4000) || null, instructions: text(form.get("instructions"), 8000) || null, ...values, isActive: form.get("isActive") === "on", ingredients };
}

const selectedFile = (value: FormDataEntryValue | null): value is File => typeof File !== "undefined" && value instanceof File && value.name.length > 0 && value.size > 0;
export const MAX_EDITORIAL_COVER_BYTES = 4 * 1024 * 1024;
export type EditorialCover = { bytes: Uint8Array; contentType: "image/png" | "image/jpeg" | "image/webp"; extension: "png" | "jpg" | "webp" } | null;
export async function editorialCover(value: FormDataEntryValue | null): Promise<EditorialCover> {
  if (!selectedFile(value)) return null;
  if (value.size > MAX_EDITORIAL_COVER_BYTES) throw new Error("A capa deve ter no máximo 4 MB.");
  if (value.type !== "image/png" && value.type !== "image/jpeg" && value.type !== "image/webp") throw new Error("Use uma capa PNG, JPG ou WebP.");
  const bytes = new Uint8Array(await value.arrayBuffer());
  const png = [137, 80, 78, 71, 13, 10, 26, 10].every((byte, index) => bytes[index] === byte);
  const jpeg = bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
  const webp = String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" && String.fromCharCode(...bytes.slice(8, 12)) === "WEBP";
  if ((value.type === "image/png" && !png) || (value.type === "image/jpeg" && !jpeg) || (value.type === "image/webp" && !webp)) throw new Error("Use uma capa PNG, JPG ou WebP.");
  return { bytes, contentType: value.type, extension: value.type === "image/jpeg" ? "jpg" : value.type.slice(6) as "png" | "webp" };
}
