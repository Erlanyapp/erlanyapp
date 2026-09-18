import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import path from "node:path";
import ts from "typescript";

const root = path.resolve(import.meta.dirname, "..");
const source = (file) => readFile(path.join(root, file), "utf8");
const moduleUrl = async (file) => {
  const output = ts.transpileModule(await source(file), {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  return `data:text/javascript;base64,${Buffer.from(output).toString("base64")}`;
};

const domain = await import(await moduleUrl("src/domain/admin-workout.ts"));
const { createAdminWorkoutRepository } = await import(await moduleUrl("src/repositories/admin-workout-repository.ts"));
const clientA = "00000000-0000-0000-0000-000000000001";
const clientB = "00000000-0000-0000-0000-000000000002";
const workout = "00000000-0000-0000-0000-000000000003";
const exercise = "00000000-0000-0000-0000-000000000004";

const assignmentForm = (overrides = {}) => {
  const form = new FormData();
  form.set("clientId", clientA);
  form.set("startsOn", "2026-09-17");
  form.set("endsOn", "2026-10-17");
  form.set("day-0", "WORKOUT");
  form.set("day-1", "REST");
  for (let weekday = 2; weekday < 7; weekday += 1) form.set(`day-${weekday}`, "OFF");
  for (const [key, value] of Object.entries(overrides)) form.set(key, value);
  return form;
};

test("workout CRUD validation enforces scope ownership, status and active state", () => {
  const form = new FormData();
  form.set("name", "Treino de pernas");
  form.set("description", "Composição de treino");
  form.set("scope", "CLIENT");
  form.set("clientId", clientA);
  form.set("status", "published");
  form.set("durationMinutes", "45");
  form.set("isActive", "on");
  assert.deepEqual(domain.workoutInput(form), {
    name: "Treino de pernas", description: "Composição de treino", category: null,
    level: null, durationMinutes: 45, scope: "CLIENT", clientId: clientA,
    status: "published", isActive: true,
  });
  form.set("clientId", clientB);
  assert.equal(domain.workoutInput(form).clientId, clientB);
  form.set("clientId", "");
  assert.throws(() => domain.workoutInput(form), /conteúdo privado/);
});

test("exercise configuration accepts series, repetitions, load, rest, duration and notes", () => {
  const form = new FormData();
  form.set("exerciseId", exercise);
  form.set("sets", "4");
  form.set("repetitions", "10-12");
  form.set("load", "20 kg");
  form.set("restSeconds", "60");
  form.set("durationSeconds", "90");
  form.set("notes", "Cadência controlada");
  assert.deepEqual(domain.workoutExerciseInput(form), {
    exerciseId: exercise, sets: 4, repetitions: "10-12", load: "20 kg",
    restSeconds: 60, durationSeconds: 90, notes: "Cadência controlada",
  });
  form.set("durationSeconds", "0");
  assert.equal(domain.workoutExerciseInput(form).durationSeconds, null);
});

test("assignment editing validates client, period and weekly schedule without creating a new assignment", () => {
  const input = domain.assignmentInput(assignmentForm({ clientId: clientB }));
  assert.equal(input.clientId, clientB);
  assert.deepEqual(input.days, [{ weekday: 0, kind: "WORKOUT" }, { weekday: 1, kind: "REST" }]);
  assert.throws(() => domain.assignmentInput(assignmentForm({ endsOn: "2026-09-16" })), /data final/);
});

test("repository persists workout composition, configuration, removal and position swaps", async () => {
  const repository = await source("src/repositories/admin-workout-repository.ts");
  assert.match(repository, /from\("workout_exercises"\)\.insert\(\{workout_id:workoutId,exercise_id:input\.exerciseId,position:count\?\?0/);
  assert.match(repository, /update\(\{sets:input\.sets,repetitions:input\.repetitions,load:input\.load,rest_seconds:input\.restSeconds,duration_seconds:input\.durationSeconds,notes:input\.notes\}\)\.eq\("id",id\)/);
  assert.match(repository, /from\("workout_exercises"\)\.delete\(\)\.eq\("id",id\)/);
  assert.match(repository, /moveExercise\(workoutId:string,id:string,direction:-1\|1\)/);
  assert.match(repository, /update\(\{position:-1\}\).*update\(\{position:current\.position\}\).*update\(\{position:other\.position\}\)/s);
});

test("assignment create, edit, activation and cancellation use the same assignment row and schedule relation", async () => {
  const repository = await source("src/repositories/admin-workout-repository.ts");
  const actions = await source("src/app/(admin)/admin/treinos/actions.ts");
  assert.match(repository, /from\("workout_assignments"\)\.insert/);
  assert.match(repository, /updateAssignment\(id:string,input:AssignmentInput\).*\.update\(\{client_id:input\.clientId,starts_on:input\.startsOn,ends_on:input\.endsOn,notes:input\.notes\}\)\.eq\("id",id\)/s);
  assert.match(repository, /workout_assignment_schedule"\)\.delete\(\)\.eq\("assignment_id",id\)/);
  assert.match(repository, /assignment_id:id,weekday:day\.weekday,schedule_kind:day\.kind/);
  assert.match(repository, /toggleAssignment\(id:string,isActive:boolean\).*update\(\{is_active:isActive\}\)\.eq\("id",id\)/s);
  assert.match(repository, /cancelAssignment\(id:string\).*delete\(\)\.eq\("id",id\)/s);
  assert.match(actions, /updateAssignment\(workoutId:\s*string,\s*id:\s*string,\s*form:\s*FormData\).*adminWorkoutService\.updateAssignment\(id, form\).*toggleAssignment\(id, form\.get\("isActive"\) === "on"\)/s);
});

test("workout creation maps domain camelCase fields to database columns and keeps form values on errors", async () => {
  const repository = await source("src/repositories/admin-workout-repository.ts");
  const actions = await source("src/app/(admin)/admin/treinos/actions.ts");
  const editor = await source("src/components/admin/workout-editor.tsx");
  assert.match(repository, /insert\(\{name:input\.name,description:input\.description,category:input\.category,level:input\.level,duration_minutes:input\.durationMinutes,scope:input\.scope,client_id:input\.clientId,status:input\.status,is_active:input\.isActive,slug\}\)/);
  assert.doesNotMatch(repository, /insert\(\{\.\.\.input/);
  assert.match(actions, /return \{ error: message\(error\) \}/);
  assert.match(actions, /catch \(error\) \{\s*return \{ error: message\(error\) \};\s*\}\s*refresh\(workout\);\s*redirect\(`\/admin\/treinos\/\$\{workout\}`\);/s);
  assert.match(editor, /useActionState/);
  assert.match(editor, /const \[values, setValues\] = useState/);
  assert.match(editor, /state\.error \? <p className="crm-form-error" role="alert">/);
});

test("repository sends only database column names for a real GLOBAL workout insert", async () => {
  const writes = [];
  const client = {
    from(table) {
      assert.equal(table, "workouts");
      return {
        insert(payload) {
          writes.push(payload);
          return { select: () => ({ single: async () => ({ data: { id: workout }, error: null }) }) };
        },
      };
    },
  };
  const id = await createAdminWorkoutRepository(client).save(null, {
    name: "Treino Global", description: null, category: null, level: null,
    durationMinutes: 45, scope: "GLOBAL", clientId: null, status: "draft", isActive: true,
  });
  assert.equal(id, workout);
  assert.deepEqual(Object.keys(writes[0]).sort(), [
    "category", "client_id", "description", "duration_minutes", "is_active",
    "level", "name", "scope", "slug", "status",
  ]);
  assert.equal(writes[0].client_id, null);
  assert.equal(writes[0].duration_minutes, 45);
  assert.equal(writes[0].is_active, true);
});

test("admin list delegates search, status, scope, count and database pagination to Supabase", async () => {
  const repository = await source("src/repositories/admin-workout-repository.ts");
  const page = await source("src/app/(admin)/admin/treinos/page.tsx");
  const loading = await source("src/app/(admin)/admin/treinos/loading.tsx");
  const error = await source("src/app/(admin)/admin/treinos/error.tsx");
  assert.match(repository, /\.ilike\("name",`%\$\{filters\.q\.slice\(0,100\)\}%`\)/);
  assert.match(repository, /\.eq\("is_active",filters\.status==="active"\)/);
  assert.match(repository, /\.eq\("scope",filters\.scope\)/);
  assert.match(repository, /\.range\(start,start\+size-1\)/);
  assert.match(repository, /\{count:"exact"\}/);
  assert.match(page, /Nenhum treino encontrado/);
  assert.match(page, /data\.page\*data\.pageSize<data\.total/);
  assert.match(loading, /aria-busy="true"/);
  assert.match(error, /Tentar novamente/);
});

test("admin detail exposes assignment edit controls and refreshes the server-rendered data", async () => {
  const workspace = await source("src/components/admin/workout-workspace.tsx");
  const detail = workspace;
  const actions = await source("src/app/(admin)/admin/treinos/actions.ts");
  assert.match(workspace, /setModal\(assignment\)/);
  assert.match(workspace, /updateAssignment\(workoutId, assignment\.id, form\)/);
  assert.match(workspace, /assignWorkout\(workoutId, form\)/);
  for (const field of ["clientId", "startsOn", "endsOn", "isActive"]) {
    assert.match(detail, new RegExp(`name=\"${field.replace(/[{}$]/g, "\\$&")}\"`));
  }
  assert.match(detail, /name=\{`day-\$\{weekday\}`\}/);
  assert.match(actions, /revalidatePath\(`\/admin\/treinos\/\$\{id\}`\)/);
});

test("client assigned-workout query is scoped to the authenticated owner and active São Paulo date", async () => {
  const repository = await source("src/repositories/content-repository.ts");
  assert.match(repository, /from\("workout_assignments"\)/);
  assert.match(repository, /\.eq\("client_id", owner\)/);
  assert.match(repository, /\.eq\("is_active", true\)/);
  assert.match(repository, /\.lte\("starts_on", today\)/);
  assert.match(repository, /schedule:workout_assignment_schedule\(weekday,schedule_kind\)/);
  assert.match(repository, /ends_on\.is\.null,ends_on\.gte/);
  assert.match(repository, /const today = saoPauloDate\(\)/);
  assert.match(repository, /row\.is_active === true/);
  assert.doesNotMatch(repository, /row\.status === "published"/);
  assert.doesNotMatch(repository, /service_role/);
});

test("assignment UI presents trusted client names while retaining UUID values", async () => {
  const repository = await source("src/repositories/admin-workout-repository.ts");
  const detail = await source("src/components/admin/workout-workspace.tsx");
  const editor = await source("src/components/admin/workout-editor.tsx");
  assert.match(repository, /select\("id,profile:profiles\(full_name,email,avatar_url\)"\)/);
  assert.match(repository, /name:typeof profile\?\.full_name==="string"/);
  assert.match(detail, /value=\{client\.id\}>\s*\{client\.name\}/s);
  assert.match(editor, /value=\{client\.id\}>\{client\.name\}/);
  assert.doesNotMatch(detail, /clientName\(client\)/);
});

test("CRM uses assignment relations and keeps assignment lifecycle information after refresh", async () => {
  const repository = await source("src/repositories/admin-client-records-repository.ts");
  assert.match(repository, /read\("workout_assignments","id,starts_on,ends_on,is_active/);
  assert.match(repository, /workout:workouts\(id,name,description,status,is_active,level,duration_minutes\)/);
  assert.match(repository, /schedule:workout_assignment_schedule/);
  assert.match(repository, /\["Situação da atribuição",row\.is_active\?"Ativa":"Inativa"\]/);
  assert.match(repository, /\["Dias configurados",String\(schedule\.length\)\]/);
});

test("migration enables RLS and limits assignment visibility to admins or the owning client", async () => {
  const migration = await source("supabase/migrations/20260917194157_workout_assignments_schedule.sql");
  assert.match(migration, /alter table public\.workout_assignments enable row level security/);
  assert.match(migration, /alter table public\.workout_assignment_schedule enable row level security/);
  assert.match(migration, /admin full access workout assignments/);
  assert.match(migration, /clients read own workout assignments.*client_id in \(select id from public\.clients where user_id = \(select auth\.uid\(\)\)\)/s);
  assert.match(migration, /clients read own workout assignment schedule/);
  assert.equal(workout.length, 36);
});

test("assignment migration releases only active in-period assignments to their owning client", async () => {
  const migration = await source("supabase/migrations/20260918125557_allow_assigned_workout_release.sql");
  assert.match(migration, /assignment\.workout_id = workouts\.id/);
  assert.match(migration, /assignment\.starts_on <= current_date/);
  assert.match(migration, /assignment\.ends_on is null or assignment\.ends_on >= current_date/);
  assert.match(migration, /client\.user_id = \(select auth\.uid\(\)\)/);
  assert.match(migration, /drop policy if exists "workout exercises accessible workout read"/);
});
