import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
import path from "node:path";
import ts from "typescript";

const require = createRequire(import.meta.url);
const root = path.resolve(import.meta.dirname, "..");
const source = (relative) => readFile(path.join(root, relative), "utf8");

async function moduleUrl(relative) {
  const input = await source(relative);
  let output = ts.transpileModule(input, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
  for (const [, specifier] of output.matchAll(/from "([^"]+)"/g)) {
    if (specifier.startsWith("@/")) output = output.replaceAll(`"${specifier}"`, JSON.stringify(await moduleUrl(`src/${specifier.slice(2)}.ts`)));
    else if (!specifier.startsWith("node:")) output = output.replaceAll(`"${specifier}"`, JSON.stringify(pathToFileURL(require.resolve(specifier)).href));
  }
  return `data:text/javascript;base64,${Buffer.from(output).toString("base64")}`;
}

const domain = await import(await moduleUrl("src/domain/client-intake.ts"));
const { createClientIntakeRepository } = await import(await moduleUrl("src/repositories/client-intake-repository.ts"));

const completedForm = () => {
  const form = new FormData();
  form.set("birthDate", "1994-06-12");
  form.set("heightCm", "168");
  form.set("currentWeightKg", "72,5");
  form.set("targetWeightKg", "65");
  form.set("primaryGoal", "WEIGHT_LOSS");
  form.set("experienceLevel", "BEGINNER");
  form.set("trainingDaysPerWeek", "3");
  form.set("trainingLocation", "HOME");
  form.set("sessionMinutes", "45");
  form.set("hasLimitations", "yes");
  form.set("hasProfessionalGuidance", "no");
  form.set("restrictions", "  Sem impacto  ");
  return form;
};

test("initial intake validates a completed interview and rejects invalid values", () => {
  const result = domain.intakeInput(completedForm());
  assert.deepEqual(result, {
    birthDate: "1994-06-12", heightCm: 168, currentWeightKg: 72.5, targetWeightKg: 65,
    primaryGoal: "WEIGHT_LOSS", experienceLevel: "BEGINNER", trainingDaysPerWeek: 3,
    trainingLocation: "HOME", sessionMinutes: 45, hasLimitations: true,
    hasProfessionalGuidance: false, restrictions: "Sem impacto",
  });
  const invalid = completedForm();
  invalid.set("trainingDaysPerWeek", "9");
  assert.throws(() => domain.intakeInput(invalid), /Dias por semana inválido/);
});

test("age is derived from the civil birth date without timezone conversion", () => {
  assert.equal(domain.ageFromBirthDate("2000-10-16", new Date("2026-10-15T12:00:00Z")), 25);
  assert.equal(domain.ageFromBirthDate("2000-10-15", new Date("2026-10-15T12:00:00Z")), 26);
  assert.equal(domain.ageFromBirthDate("invalid"), null);
});

test("draft accepts incomplete answers while validating supplied values", () => {
  const draft = new FormData();
  draft.set("heightCm", "170");
  assert.deepEqual(domain.intakeDraft(draft), {
    birthDate: null, heightCm: 170, currentWeightKg: null, targetWeightKg: null,
    primaryGoal: null, experienceLevel: null, trainingDaysPerWeek: null,
    trainingLocation: null, sessionMinutes: null, hasLimitations: false,
    hasProfessionalGuidance: false, restrictions: "",
  });
  draft.set("primaryGoal", "FORGED");
  assert.throws(() => domain.intakeDraft(draft), /Objetivo inválido/);
});

test("intake persistence resolves the authenticated client internally and upserts one evolving record", async () => {
  const calls = [];
  const api = {
    from(table) {
      assert.equal(table, "client_initial_intakes");
      return {
        upsert: async (payload, options) => { calls.push([payload, options]); return { error: null }; },
        select() { return this; }, eq() { return this; }, maybeSingle: async () => ({ data: null, error: null }),
      };
    },
  };
  const repository = createClientIntakeRepository(api, async () => "client-owned-by-auth");
  await repository.save(domain.intakeInput(completedForm()));
  assert.equal(calls.length, 1);
  assert.equal(calls[0][0].client_id, "client-owned-by-auth");
  assert.equal(calls[0][0].status, "COMPLETED");
  assert.equal(calls[0][0].current_weight_kg, 72.5);
  assert.deepEqual(calls[0][1], { onConflict: "client_id" });
});

test("migration keeps the initial intake private to its owner or an ADMIN", async () => {
  const migration = await source("supabase/migrations/20261015153000_client_initial_intakes.sql");
  assert.match(migration, /create table if not exists public\.client_initial_intakes/);
  assert.match(migration, /alter table public\.client_initial_intakes enable row level security/);
  assert.match(migration, /revoke all on public\.client_initial_intakes from anon, public/);
  assert.match(migration, /auth\.jwt\(\) -> 'app_metadata' ->> 'role'\) = 'ADMIN'/);
  assert.match(migration, /client_id in \(select id from public\.clients where user_id = \(select auth\.uid\(\)\)\)/);
  assert.doesNotMatch(migration, /service_role/i);
});

test("security correction removes destructive grants and splits ownership policies by operation", async () => {
  const migration = await source("supabase/migrations/20261015154500_harden_client_initial_intake_access.sql");
  assert.match(migration, /revoke all privileges on table public\.client_initial_intakes from public, anon, authenticated/);
  assert.match(migration, /grant select, insert, update on table public\.client_initial_intakes to authenticated/);
  assert.match(migration, /for select to authenticated/);
  assert.match(migration, /for insert to authenticated/);
  assert.match(migration, /for update to authenticated/);
  assert.match(migration, /clients insert own initial intake[\s\S]*?with check \(client_id in \(select id from public\.clients where user_id = \(select auth\.uid\(\)\)\)\)/);
  assert.doesNotMatch(migration, /for delete/i);
  assert.doesNotMatch(migration, /for all/i);
  assert.doesNotMatch(migration, /service_definer/i);
});
