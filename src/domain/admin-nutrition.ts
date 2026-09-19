import type { NutritionAssignmentInput, NutritionMealInput, NutritionPlanInput } from "@/types/admin-nutrition";

const uuid = (value: FormDataEntryValue | null) => typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value) ? value : null;
const text = (value: FormDataEntryValue | null, max: number) => typeof value === "string" ? value.trim().slice(0, max) : "";
const optionalNumber = (value: FormDataEntryValue | null, max: number) => { const raw = text(value, 30); if (!raw) return null; const parsed = Number(raw); return Number.isFinite(parsed) && parsed >= 0 && parsed <= max ? parsed : null; };
const date = (value: FormDataEntryValue | null) => { const candidate = text(value, 10); return /^\d{4}-\d{2}-\d{2}$/.test(candidate) ? candidate : null; };

export const nutritionId = (value: FormDataEntryValue | null, label = "Registro") => { const id = uuid(value); if (!id) throw new Error(`${label} inválido.`); return id; };
export function nutritionPlanInput(form: FormData): NutritionPlanInput {
  const name = text(form.get("name"), 120); if (name.length < 2) throw new Error("Informe um nome com pelo menos 2 caracteres.");
  const scope = form.get("scope") === "CLIENT" ? "CLIENT" : "GLOBAL";
  const clientId = scope === "CLIENT" ? uuid(form.get("clientId")) : null;
  if (scope === "CLIENT" && !clientId) throw new Error("Selecione o cliente do plano personalizado.");
  return { name, description: text(form.get("description"), 4000) || null, objective: text(form.get("objective"), 160) || null, notes: text(form.get("notes"), 4000) || null, scope, clientId, isActive: form.get("isActive") === "on" };
}
export function nutritionMealInput(form: FormData): NutritionMealInput {
  const name = text(form.get("name"), 120); if (name.length < 2) throw new Error("Informe o nome da refeição.");
  const mealTime = text(form.get("mealTime"), 5) || null; if (mealTime && !/^\d{2}:\d{2}$/.test(mealTime)) throw new Error("Informe um horário válido.");
  const foodNames = form.getAll("foodName"), quantities = form.getAll("quantity"), units = form.getAll("unit"), itemNotes = form.getAll("itemNotes");
  const items = foodNames.map((value, index) => ({ foodName: text(value, 180), quantity: optionalNumber(quantities[index] ?? null, 100000), unit: text(units[index] ?? null, 40) || null, notes: text(itemNotes[index] ?? null, 500) || null, itemOrder: index })).filter((item) => item.foodName);
  if (!items.length) throw new Error("Adicione ao menos um alimento à refeição.");
  const recipeId = text(form.get("recipeId"), 50) ? uuid(form.get("recipeId")) : null;
  if (text(form.get("recipeId"), 50) && !recipeId) throw new Error("Receita inválida.");
  return { name, mealTime, description: text(form.get("description"), 2000) || null, guidance: text(form.get("guidance"), 3000) || null, recipeId, items };
}
export function nutritionAssignmentInput(form: FormData): NutritionAssignmentInput {
  const clientId = uuid(form.get("clientId")); if (!clientId) throw new Error("Selecione um cliente.");
  const startsOn = date(form.get("startsOn")); if (!startsOn) throw new Error("Informe a data inicial.");
  const endsOn = date(form.get("endsOn")); if (endsOn && endsOn < startsOn) throw new Error("A data final não pode ser anterior à inicial.");
  const days = Array.from({ length: 7 }, (_, weekday) => weekday).filter((weekday) => form.get(`day-${weekday}`) === "on");
  if (!days.length) throw new Error("Selecione pelo menos um dia da semana.");
  return { clientId, startsOn, endsOn, notes: text(form.get("notes"), 2000) || null, days };
}
