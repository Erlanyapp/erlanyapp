import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import path from "node:path";
import ts from "typescript";

const root = path.resolve(import.meta.dirname, "..");
const source = (file) => readFile(path.join(root, file), "utf8");
const moduleUrl = async (file) => `data:text/javascript;base64,${Buffer.from(ts.transpileModule(await source(file), { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText).toString("base64")}`;
const domain = await import(await moduleUrl("src/domain/admin-editorial.ts"));
const clientA = "00000000-0000-0000-0000-000000000001";
const clientB = "00000000-0000-0000-0000-000000000002";

const tipForm = (extra = {}) => { const form = new FormData(); form.set("title", "Dica Teste"); form.set("slug", "dica-teste"); form.set("summary", "Resumo"); form.set("content", "Conteúdo editorial válido."); form.set("scope", "CLIENT"); form.set("clientId", clientA); form.set("isActive", "on"); for (const [key, value] of Object.entries(extra)) form.set(key, value); return form; };
const recipeForm = (extra = {}) => { const form = new FormData(); form.set("name", "Receita Teste"); form.set("slug", "receita-teste"); form.set("description", "Descrição"); form.set("instructions", "Misture e sirva."); form.set("scope", "CLIENT"); form.set("clientId", clientA); form.set("isActive", "on"); form.append("ingredientName", "Ovos"); form.append("ingredientQuantity", "2"); form.append("ingredientUnit", "unidades"); form.append("ingredientNotes", "Cozidos"); form.append("ingredientName", "Aveia"); form.append("ingredientQuantity", "40"); form.append("ingredientUnit", "g"); form.append("ingredientNotes", ""); for (const [key, value] of Object.entries(extra)) form.set(key, value); return form; };

test("tips validate CRUD fields, slug, scope and CLIENT ownership", () => {
  assert.deepEqual(domain.tipInput(tipForm()), { title: "Dica Teste", slug: "dica-teste", summary: "Resumo", content: "Conteúdo editorial válido.", categoryId: null, scope: "CLIENT", clientId: clientA, isActive: true });
  assert.equal(domain.tipInput(tipForm({ clientId: clientB })).clientId, clientB);
  assert.equal(domain.tipInput(tipForm({ scope: "GLOBAL" })).clientId, null);
  assert.throws(() => domain.tipInput(tipForm({ clientId: "" })), /cliente do conteúdo privado/);
  assert.equal(domain.editorialSlug("Dica Saúde & Bem-estar"), "dica-saude-bem-estar");
});

test("recipes validate CRUD fields and persist ingredients in submitted order", () => {
  const recipe = domain.recipeInput(recipeForm());
  assert.equal(recipe.ingredients.length, 2);
  assert.deepEqual(recipe.ingredients[0], { name: "Ovos", quantity: "2", unit: "unidades", notes: "Cozidos", ingredientOrder: 0 });
  assert.deepEqual(recipe.ingredients[1], { name: "Aveia", quantity: "40", unit: "g", notes: null, ingredientOrder: 1 });
  assert.throws(() => domain.recipeInput(new FormData()), /nome com pelo menos/);
});

test("editorial filters support server-side search, status, scope, client, category and bounded pagination", () => {
  assert.deepEqual(domain.editorialFilters({ q: " proteína ", status: "inactive", scope: "CLIENT", category: clientA, client: clientB, page: "3" }), { page: 3, search: "proteína", status: "inactive", scope: "CLIENT", categoryId: clientA, clientId: clientB });
  assert.equal(domain.editorialFilters({ page: "-2" }).page, 1);
});

test("repository uses real paged queries and persisted ingredient replacement without duplication", async () => {
  const repository = await source("src/repositories/admin-editorial-repository.ts");
  assert.match(repository, /from\("tips"\).*count: "exact"/s); assert.match(repository, /\.ilike\("title", `%\$\{filters\.search\}%`\)/); assert.match(repository, /\.eq\("is_active", filters\.status === "active"\)/); assert.match(repository, /\.range\(start, start \+ 19\)/);
  assert.match(repository, /from\("recipes"\).*count: "exact"/s); assert.match(repository, /\.ilike\("name", `%\$\{filters\.search\}%`\)/); assert.match(repository, /from\("recipe_ingredients"\)\.delete\(\)\.eq\("recipe_id", recipeId\)/); assert.match(repository, /ingredient_order: index/); assert.match(repository, /unit: entry\.unit, notes: entry\.notes/);
});

test("admin actions require ADMIN and revalidate client and admin surfaces", async () => {
  const tips = await source("src/app/(admin)/admin/dicas/actions.ts"); const recipes = await source("src/app/(admin)/admin/alimentacao/receitas/actions.ts");
  for (const value of [tips, recipes]) { assert.match(value, /requireAdmin\(\)/); assert.match(value, /revalidatePath\("\/app\//); assert.match(value, /toggle/); assert.match(value, /isNextRedirect\(reason\)\) throw reason/); }
});

test("recipe integration uses active database recipes in the existing meal editor", async () => {
  const nutritionRepository = await source("src/repositories/admin-nutrition-repository.ts"); const workspace = await source("src/components/admin/nutrition-workspace.tsx");
  assert.match(nutritionRepository, /from\("recipes"\)\.select\("id,name"\)\.eq\("is_active", true\)/); assert.match(workspace, /name="recipeId"/); assert.match(workspace, /recipes\.map/);
});

test("client consumes only RLS-released active content and renders recipe cover details", async () => {
  const repository = await source("src/repositories/content-repository.ts"); const recipePage = await source("src/app/(client)/app/alimentacao/receitas/[id]/page.tsx"); const tipPage = await source("src/app/(client)/app/dicas/[id]/page.tsx");
  assert.match(repository, /from\("recipes"\).*\.eq\("is_active", true\)/s); assert.match(repository, /\.or\(await contentScope\(\)\)/); assert.doesNotMatch(repository, /service_role/); assert.match(recipePage, /recipe\.imageUrl/); assert.match(recipePage, /item\.unit/); assert.match(recipePage, /item\.notes/); assert.match(tipPage, /tip\.imageUrl/);
  assert.match(repository, /isMissingStorageObject\(error\)/);
});

test("migration enforces active publication and client isolation inside RLS", async () => {
  const migration = await source("supabase/migrations/20260919232820_editorial_recipes_and_content_access.sql");
  assert.match(migration, /add column if not exists is_active boolean not null default true/); assert.match(migration, /add column if not exists image_asset_id uuid references public\.media_assets/); assert.match(migration, /tips released to client/); assert.match(migration, /recipes released to client/); assert.match(migration, /recipe ingredients released through recipe/); assert.match(migration, /recipe\.is_active/); assert.match(migration, /client\.user_id = \(select auth\.uid\(\)\)/); assert.match(migration, /assignment\.is_active/); assert.match(migration, /America\/Sao_Paulo/);
});

test("editorial cover Storage access inherits the released tip and recipe RLS", async () => {
  const migration = await source("supabase/migrations/20260924180750_fix_editorial_recipe_cover_policy.sql");
  assert.match(migration, /create policy "editorial cover read"/);
  assert.match(migration, /on storage\.objects for select to authenticated/);
  assert.match(migration, /from public\.tips tip/);
  assert.match(migration, /from public\.recipes recipe/);
  assert.match(migration, /asset\.path = storage\.objects\.name/);
});
