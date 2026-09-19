import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import path from "node:path";
import ts from "typescript";

const root = path.resolve(import.meta.dirname, "..");
const source = (file) => readFile(path.join(root, file), "utf8");
const moduleUrl = async (file) => `data:text/javascript;base64,${Buffer.from(ts.transpileModule(await source(file), { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText).toString("base64")}`;
const domain = await import(await moduleUrl("src/domain/admin-nutrition.ts"));
const clientA = "00000000-0000-0000-0000-000000000001";
const clientB = "00000000-0000-0000-0000-000000000002";

const planForm = (extra = {}) => { const form = new FormData(); form.set("name", "Plano A"); form.set("objective", "Redução de gordura"); form.set("scope", "CLIENT"); form.set("clientId", clientA); form.set("isActive", "on"); for (const [key, value] of Object.entries(extra)) form.set(key, value); return form; };
const mealForm = (extra = {}) => { const form = new FormData(); form.set("name", "Café da manhã"); form.set("mealTime", "07:30"); form.append("foodName", "Ovos"); form.append("quantity", "2"); form.append("unit", "unidades"); form.append("itemNotes", "Cozidos"); form.append("foodName", "Aveia"); form.append("quantity", "40"); form.append("unit", "g"); form.append("itemNotes", ""); for (const [key, value] of Object.entries(extra)) form.set(key, value); return form; };
const assignmentForm = (extra = {}) => { const form = new FormData(); form.set("clientId", clientA); form.set("startsOn", "2026-09-19"); form.set("endsOn", "2026-10-19"); form.set("day-0", "on"); form.set("day-2", "on"); form.set("day-4", "on"); for (const [key, value] of Object.entries(extra)) form.set(key, value); return form; };

test("nutrition plan CRUD validation enforces CLIENT ownership and active scope", () => {
  assert.deepEqual(domain.nutritionPlanInput(planForm()), { name: "Plano A", description: null, objective: "Redução de gordura", notes: null, scope: "CLIENT", clientId: clientA, isActive: true });
  assert.equal(domain.nutritionPlanInput(planForm({ clientId: clientB })).clientId, clientB);
  assert.throws(() => domain.nutritionPlanInput(planForm({ clientId: "" })), /cliente do plano/);
  assert.equal(domain.nutritionPlanInput(planForm({ scope: "GLOBAL" })).clientId, null);
});
test("meal input persists structured foods, quantities, units, time, recipe and notes", () => {
  const input = domain.nutritionMealInput(mealForm());
  assert.equal(input.mealTime, "07:30"); assert.equal(input.items.length, 2); assert.deepEqual(input.items[0], { foodName: "Ovos", quantity: 2, unit: "unidades", notes: "Cozidos", itemOrder: 0 });
  assert.throws(() => domain.nutritionMealInput(mealForm({ mealTime: "invalid" })), /horário válido/);
});
test("assignment edit validates period and weekly agenda without accepting an empty schedule", () => {
  assert.deepEqual(domain.nutritionAssignmentInput(assignmentForm()).days, [0, 2, 4]);
  assert.equal(domain.nutritionAssignmentInput(assignmentForm({ clientId: clientB })).clientId, clientB);
  assert.throws(() => domain.nutritionAssignmentInput(assignmentForm({ endsOn: "2026-09-18" })), /data final/);
  const empty = assignmentForm(); for (let day = 0; day < 7; day += 1) empty.delete(`day-${day}`); assert.throws(() => domain.nutritionAssignmentInput(empty), /pelo menos um dia/);
});
test("admin repository and actions persist plans, meals, items and assignments through database relations", async () => {
  const repository = await source("src/repositories/admin-nutrition-repository.ts"); const actions = await source("src/app/(admin)/admin/alimentacao/actions.ts");
  assert.match(repository, /from\("nutrition_plans"\).*\.insert\(payload\)/s); assert.match(repository, /objective: input\.objective, notes: input\.notes, scope: input\.scope, client_id: input\.clientId, is_active: input\.isActive/);
  assert.match(repository, /from\("nutrition_meal_items"\)\.insert\(input\.items\.map/); assert.match(repository, /nutrition_meal_id: mealId, food_name: item\.foodName, quantity: item\.quantity, unit: item\.unit/);
  assert.match(repository, /from\("nutrition_assignments"\)\.insert\(\{ nutrition_plan_id: planId, client_id: input\.clientId/); assert.match(repository, /nutrition_assignment_schedule"\)\.insert\(days\.map/);
  assert.match(repository, /updateAssignment\(planId: string, id: string, input: NutritionAssignmentInput\).*\.eq\("id", id\)\.eq\("nutrition_plan_id", planId\)/s);
  assert.match(actions, /requireAdmin\(\)/); assert.match(actions, /revalidatePath\("\/app\/alimentacao"\)/);
});
test("admin list uses real search, status, scope, count, pagination, loading and error states", async () => {
  const repository = await source("src/repositories/admin-nutrition-repository.ts"); const page = await source("src/app/(admin)/admin/alimentacao/page.tsx"); const loading = await source("src/app/(admin)/admin/alimentacao/loading.tsx"); const error = await source("src/app/(admin)/admin/alimentacao/error.tsx");
  assert.match(repository, /\.ilike\("name", `%\$\{filters\.q\.slice\(0, 100\)\}%`\)/); assert.match(repository, /\.eq\("is_active", filters\.status === "active"\)/); assert.match(repository, /\.range\(start, start \+ pageSize - 1\)/); assert.match(repository, /count: "exact"/);
  assert.match(page, /Nenhum plano alimentar encontrado/); assert.match(loading, /aria-busy="true"/); assert.match(error, /Tentar novamente/);
});
test("client nutrition uses active plans with server RLS, structured meal items and no browser service role", async () => {
  const repository = await source("src/repositories/content-repository.ts"); const clientPage = await source("src/app/(client)/app/alimentacao/page.tsx"); const migration = await source("supabase/migrations/20260919114109_nutrition_personalized_assignments.sql");
  assert.match(repository, /from\("nutrition_plans"\)\.select\("\*"\)\.eq\("is_active", true\)/); assert.match(repository, /nutrition_meal_items\(id,food_name,quantity,unit,notes,item_order\)/); assert.match(clientPage, /meal\.items\.map/); assert.doesNotMatch(repository, /service_role/);
  assert.match(migration, /nutrition assignments own current read/); assert.match(migration, /client\.user_id = \(select auth\.uid\(\)\)/); assert.match(migration, /assignment\.starts_on <= \(now\(\) at time zone 'America\/Sao_Paulo'\)::date/); assert.match(migration, /schedule\.weekday = \(\(extract\(isodow/); assert.match(migration, /alter table public\.nutrition_meal_items enable row level security/);
});
