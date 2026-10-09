const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const text = (form: FormData, name: string, limit: number) => typeof form.get(name) === "string" ? String(form.get(name)).trim().slice(0, limit) : "";

export const progressId = (value: unknown, label = "Registro") => {
  if (typeof value !== "string" || !uuidPattern.test(value)) throw new Error(`${label} inválido.`);
  return value;
};

export const progressDate = (value: unknown) => {
  if (typeof value !== "string" || !datePattern.test(value) || Number.isNaN(Date.parse(`${value}T12:00:00Z`)) || new Date(`${value}T12:00:00Z`).toISOString().slice(0, 10) !== value) throw new Error("Informe uma data válida.");
  if (value > new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date())) throw new Error("A data não pode estar no futuro.");
  return value;
};

export const optionalAssessmentId = (form: FormData) => {
  const value = form.get("assessmentId");
  return typeof value === "string" && value ? progressId(value, "Avaliação") : null;
};

export function assessmentInput(form: FormData) {
  return { assessedAt: progressDate(form.get("assessedAt")), notes: text(form, "notes", 4000) || null };
}

const measurementFields: Array<[string, string]> = [["chest", "Busto"], ["waist", "Cintura"], ["hips", "Quadril"], ["arm", "Braço"], ["thigh", "Coxa"], ["calf", "Panturrilha"]];
export function measurementInput(form: FormData) {
  const measurements: Record<string, string> = {};
  for (const [field, label] of measurementFields) {
    const raw = text(form, field, 20).replace(",", ".");
    if (!raw) continue;
    const value = Number(raw);
    if (!Number.isFinite(value) || value <= 0 || value > 500) throw new Error(`${label} deve ser uma medida válida em centímetros.`);
    measurements[label] = `${new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 }).format(value)} cm`;
  }
  if (!Object.keys(measurements).length) throw new Error("Informe pelo menos uma medida corporal.");
  return { recordedAt: progressDate(form.get("recordedAt")), assessmentId: optionalAssessmentId(form), measurements };
}

export function performanceInput(form: FormData) {
  const metric = text(form, "metric", 160);
  if (metric.length < 2) throw new Error("Informe a métrica de desempenho.");
  const rawValue = text(form, "value", 32).replace(",", ".");
  const value = rawValue ? Number(rawValue) : null;
  if (value !== null && (!Number.isFinite(value) || value < 0 || value > 1000000)) throw new Error("Informe um valor de desempenho válido.");
  return { metric, value, unit: text(form, "unit", 40) || null, recordedAt: progressDate(form.get("recordedAt")), assessmentId: optionalAssessmentId(form) };
}

export function progressPhotoInput(form: FormData) {
  return { category: text(form, "category", 100) || null, recordedAt: progressDate(form.get("recordedAt")), assessmentId: optionalAssessmentId(form) };
}
