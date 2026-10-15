const date = (value: FormDataEntryValue | null) => {
  const result = String(value ?? "");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(result) || Date.parse(`${result}T12:00:00Z`) > Date.now()) {
    throw new Error("Informe uma data de nascimento válida.");
  }
  return result;
};

const number = (value: FormDataEntryValue | null, label: string, min: number, max: number) => {
  const result = Number(String(value ?? "").replace(",", "."));
  if (!Number.isFinite(result) || result < min || result > max) throw new Error(`${label} inválido.`);
  return result;
};

const oneOf = <T extends string>(value: FormDataEntryValue | null, valid: readonly T[], label: string) => {
  const result = String(value ?? "") as T;
  if (!valid.includes(result)) throw new Error(`${label} inválido.`);
  return result;
};

const optional = <T>(value: FormDataEntryValue | null, parse: (entry: FormDataEntryValue | null) => T) =>
  String(value ?? "") ? parse(value) : null;

const goals = ["WEIGHT_LOSS", "MUSCLE_GAIN", "CONDITIONING", "QUALITY_OF_LIFE"] as const;
const levels = ["BEGINNER", "INTERMEDIATE", "ADVANCED"] as const;
const locations = ["GYM", "HOME", "BOTH"] as const;

export const ageFromBirthDate = (birthDate: string, today = new Date()) => {
  const [year, month, day] = birthDate.split("-").map(Number);
  if (!year || !month || !day) return null;
  const currentYear = today.getUTCFullYear();
  const beforeBirthday = today.getUTCMonth() + 1 < month || (today.getUTCMonth() + 1 === month && today.getUTCDate() < day);
  return currentYear - year - (beforeBirthday ? 1 : 0);
};

export const intakeInput = (form: FormData) => ({
  birthDate: date(form.get("birthDate")),
  heightCm: number(form.get("heightCm"), "Altura", 80, 260),
  currentWeightKg: number(form.get("currentWeightKg"), "Peso atual", 20, 500),
  targetWeightKg: number(form.get("targetWeightKg"), "Meta de peso", 20, 500),
  primaryGoal: oneOf(form.get("primaryGoal"), goals, "Objetivo"),
  experienceLevel: oneOf(form.get("experienceLevel"), levels, "Nível"),
  trainingDaysPerWeek: number(form.get("trainingDaysPerWeek"), "Dias por semana", 1, 7),
  trainingLocation: oneOf(form.get("trainingLocation"), locations, "Local"),
  sessionMinutes: number(form.get("sessionMinutes"), "Tempo por sessão", 10, 300),
  hasLimitations: form.get("hasLimitations") === "yes",
  hasProfessionalGuidance: form.get("hasProfessionalGuidance") === "yes",
  restrictions: String(form.get("restrictions") ?? "").trim().slice(0, 2000),
});

export const intakeDraft = (form: FormData) => ({
  birthDate: optional(form.get("birthDate"), date),
  heightCm: optional(form.get("heightCm"), (value) => number(value, "Altura", 80, 260)),
  currentWeightKg: optional(form.get("currentWeightKg"), (value) => number(value, "Peso atual", 20, 500)),
  targetWeightKg: optional(form.get("targetWeightKg"), (value) => number(value, "Meta de peso", 20, 500)),
  primaryGoal: optional(form.get("primaryGoal"), (value) => oneOf(value, goals, "Objetivo")),
  experienceLevel: optional(form.get("experienceLevel"), (value) => oneOf(value, levels, "Nível")),
  trainingDaysPerWeek: optional(form.get("trainingDaysPerWeek"), (value) => number(value, "Dias por semana", 1, 7)),
  trainingLocation: optional(form.get("trainingLocation"), (value) => oneOf(value, locations, "Local")),
  sessionMinutes: optional(form.get("sessionMinutes"), (value) => number(value, "Tempo por sessão", 10, 300)),
  hasLimitations: form.get("hasLimitations") === "yes",
  hasProfessionalGuidance: form.get("hasProfessionalGuidance") === "yes",
  restrictions: String(form.get("restrictions") ?? "").trim().slice(0, 2000),
});
