import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import path from "node:path";
import ts from "typescript";

const root = path.resolve(import.meta.dirname, "..");
const source = (file) => readFile(path.join(root, file), "utf8");
async function moduleUrl(file) {
  const output = ts.transpileModule(await source(file), { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
  return `data:text/javascript;base64,${Buffer.from(output).toString("base64")}`;
}
const { createWorkoutCheckinRepository } = await import(await moduleUrl("src/repositories/workout-checkin-repository.ts"));

test("check-in persists only the authenticated client's assignment and treats the daily unique constraint as idempotent", async () => {
  const writes = [];
  const repository = createWorkoutCheckinRepository({ from: (table) => ({ insert: async (payload) => {
    assert.equal(table, "workout_checkins"); writes.push(payload); return { error: null };
  } }) }, async () => "client-a");
  assert.deepEqual(await repository.create("assignment-a", "workout-a"), { alreadyCheckedIn: false });
  assert.deepEqual(writes, [{ client_id: "client-a", assignment_id: "assignment-a", workout_id: "workout-a" }]);
  const duplicate = createWorkoutCheckinRepository({ from: () => ({ insert: async () => ({ error: { code: "23505" } }) }) }, async () => "client-a");
  assert.deepEqual(await duplicate.create("assignment-a", "workout-a"), { alreadyCheckedIn: true });
});

test("check-in rejects non-unique persistence failures instead of reporting a false success", async () => {
  const repository = createWorkoutCheckinRepository({ from: () => ({ insert: async () => ({ error: new Error("RLS denied") }) }) }, async () => "client-a");
  await assert.rejects(repository.create("assignment-a", "workout-a"), /RLS denied/);
});

test("home check-in keeps its action beside the start action and exposes pending, success and error feedback", async () => {
  const card = await source("src/components/client/home-daily-workout.tsx");
  const checkin = await source("src/components/client/daily-workout-checkin.tsx");
  const css = await source("src/app/(client)/client-reference.css");
  assert.match(card, /home-daily-actions[\s\S]*Começar treino[\s\S]*DailyWorkoutCheckin/);
  assert.match(checkin, /useActionState\(markWorkoutPaid/);
  assert.match(checkin, /Registrando…/);
  assert.match(checkin, /✓ TÁ PAGO!/);
  assert.match(checkin, /aria-live="polite"/);
  assert.match(css, /home-daily-actions \{ display:flex/);
  assert.match(css, /home-checkin-form \{ flex:1/);
  assert.doesNotMatch(css, /flex-wrap:\s*wrap/);
});

test("check-in reads and progress metrics stay owner-scoped, count total/week, and retain recent real history", async () => {
  const repository = await source("src/repositories/content-repository.ts");
  const evolution = await source("src/app/(client)/app/evolucao/page.tsx");
  assert.match(repository, /getTodayWorkoutCheckin/);
  assert.match(repository, /from\("workout_checkins"\)/);
  assert.match(repository, /select\("id,workout:workouts/);
  assert.match(repository, /\.eq\("client_id", await ownClientId\(\)\)/);
  assert.match(repository, /\.eq\("completed_date", saoPauloDate\(\)\)/);
  assert.match(repository, /getWorkoutCheckinSummary/);
  assert.match(repository, /count: "exact"/);
  assert.match(repository, /\.gte\("completed_date", saoPauloWeekStart\(\)\)/);
  assert.match(evolution, /checkins\.total/);
  assert.match(evolution, /checkins\.thisWeek/);
  assert.match(evolution, /checkins\.recent\.map/);
  assert.doesNotMatch(repository, /service_role/);
});

test("check-in RLS binds every insert to auth.uid, active in-period assignment, current Sao Paulo schedule and a unique client-day", async () => {
  const migration = await source("supabase/migrations/20260918193849_workout_checkins.sql");
  const correction = await source("supabase/migrations/20260918195751_qualify_workout_checkin_policy.sql");
  assert.match(migration, /unique \(client_id, assignment_id, completed_date\)/);
  assert.match(migration, /alter table public\.workout_checkins enable row level security/);
  assert.match(correction, /workout_checkins\.client_id/);
  assert.match(correction, /assignment\.id = workout_checkins\.assignment_id/);
  assert.match(correction, /assignment\.client_id = workout_checkins\.client_id/);
  assert.match(correction, /assignment\.workout_id = workout_checkins\.workout_id/);
  assert.match(correction, /client\.user_id = \(select auth\.uid\(\)\)/);
  assert.match(correction, /assignment\.is_active/);
  assert.match(correction, /schedule\.schedule_kind = 'WORKOUT'/);
  assert.match(correction, /America\/Sao_Paulo/);
  assert.doesNotMatch(correction, /service_role/);
});

test("client weekly workouts default to the real assigned schedule while categories remain explicitly available", async () => {
  const page = await source("src/app/(client)/app/treinos/page.tsx");
  assert.match(page, /const tab = filters\.tab === "Categorias" \? "Categorias" : "Meus treinos"/);
  assert.match(page, /service\.listAssignedWorkoutSchedule\(\)/);
  assert.match(page, /scheduledWeekdays\.includes\(weekday\)/);
});

test("admin CRM includes a real client-scoped workout completion summary and history", async () => {
  const repository = await source("src/repositories/admin-client-records-repository.ts");
  assert.match(repository, /read\("workout_checkins"/);
  assert.match(repository, /\["Total",String\(workoutCheckins\.total\)\]/);
  assert.match(repository, /\["Nesta semana",String\(weekWorkoutCheckins\.total\)\]/);
  assert.match(repository, /workout:workouts\(name\)/);
  assert.match(repository, /q=q\.eq\("client_id",id\)/);
});
