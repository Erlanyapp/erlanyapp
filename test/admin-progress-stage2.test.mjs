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
  let output = ts.transpileModule(await source(relative), { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
  for (const [, specifier] of output.matchAll(/from "([^"]+)"/g)) {
    if (specifier.startsWith("@/")) output = output.replaceAll(`"${specifier}"`, JSON.stringify(await moduleUrl(`src/${specifier.slice(2)}.ts`)));
    else if (!specifier.startsWith("node:")) output = output.replaceAll(`"${specifier}"`, JSON.stringify(pathToFileURL(require.resolve(specifier)).href));
  }
  return `data:text/javascript;base64,${Buffer.from(output).toString("base64")}`;
}

const domain = await import(await moduleUrl("src/domain/admin-progress.ts"));
const { createAdminProgressRepository } = await import(await moduleUrl("src/repositories/admin-progress-repository.ts"));

test("invalid calendar dates are rejected before any database write", () => {
  for (const date of ["2026-02-30", "2026-04-31", "2026-13-01", "2099-01-01"]) assert.throws(() => domain.progressDate(date));
  assert.equal(domain.progressDate("2024-02-29"), "2024-02-29");
});

test("assessment, measurement and performance mutations persist SQL fields and keep owner filters", async () => {
  const calls = [];
  const client = { from(table) {
    const query = { select() { return this; }, eq(...args) { calls.push([table, "eq", ...args]); return this; }, insert(payload) { calls.push([table, "insert", payload]); return this; }, update(payload) { calls.push([table, "update", payload]); return this; }, delete() { calls.push([table, "delete"]); return this; }, maybeSingle() { return Promise.resolve({ data: { id: "record" }, error: null }); } };
    return query;
  } };
  const repository = createAdminProgressRepository(client);
  await repository.saveAssessment("owner", null, { assessedAt: "2026-10-09", notes: "Revisão" }, "admin");
  await repository.saveAssessment("owner", "record", { assessedAt: "2026-10-08", notes: "Editado" }, "admin");
  await repository.saveMeasurement("owner", "measure", { recordedAt: "2026-10-09", assessmentId: "record", measurements: { Cintura: "72 cm" } });
  await repository.savePerformance("owner", "metric", { recordedAt: "2026-10-09", assessmentId: "record", metric: "Carga", value: 40, unit: "kg" });
  await repository.deleteAssessment("owner", "record");
  assert.deepEqual(calls.find(call => call[1] === "insert")[2], { assessed_at: "2026-10-09", notes: "Revisão", client_id: "owner", assessed_by: "admin" });
  for (const table of ["progress_assessments", "progress_measurements", "performance_records"]) assert.ok(calls.some(call => call[0] === table && call[1] === "eq" && call[2] === "client_id" && call[3] === "owner"));
  assert.equal(calls.filter(call => call[1] === "delete").length, 1);
});

test("foreign assessment prevents measurement writes and foreign photo prevents upload", async () => {
  let writes = 0, uploads = 0;
  const client = { from(table) { return { select() { return this; }, eq() { return this; }, maybeSingle: async () => ({ data: table === "clients" ? { id: "owner" } : null, error: null }), insert() { writes++; return this; } }; }, storage: { from() { return { upload() { uploads++; } }; } } };
  const repository = createAdminProgressRepository(client);
  await assert.rejects(repository.saveMeasurement("owner", null, { recordedAt: "2026-10-09", assessmentId: "foreign", measurements: {} }), /não pertence/);
  await assert.rejects(repository.replacePhoto("owner", "foreign", { assessmentId: null }), /não pertence/);
  assert.equal(writes, 0); assert.equal(uploads, 0);
});

test("admin progress input validates assessment, measures and performance instead of trusting form IDs", () => {
  const assessment = new FormData(); assessment.set("assessedAt", "2026-10-09"); assessment.set("notes", "  Próxima revisão  ");
  assert.deepEqual(domain.assessmentInput(assessment), { assessedAt: "2026-10-09", notes: "Próxima revisão" });
  const measures = new FormData(); measures.set("recordedAt", "2026-10-09"); measures.set("waist", "72,5"); measures.set("assessmentId", "11111111-1111-4111-8111-111111111111");
  assert.deepEqual(domain.measurementInput(measures), { recordedAt: "2026-10-09", assessmentId: "11111111-1111-4111-8111-111111111111", measurements: { Cintura: "72,5 cm" } });
  const performance = new FormData(); performance.set("recordedAt", "2026-10-09"); performance.set("metric", "Agachamento"); performance.set("value", "80"); performance.set("unit", "kg");
  assert.deepEqual(domain.performanceInput(performance), { recordedAt: "2026-10-09", assessmentId: null, metric: "Agachamento", value: 80, unit: "kg" });
  for (const malformed of ["foreign", "", "not-a-uuid"]) assert.throws(() => domain.progressId(malformed));
});

test("progress repository keeps every mutation client-bound and validates the linked assessment", async () => {
  const repository = await source("src/repositories/admin-progress-repository.ts");
  for (const table of ["progress_assessments", "progress_measurements", "performance_records", "progress_photos"]) assert.match(repository, new RegExp(`from\\("${table}"\\)[\\s\\S]*?eq\\("client_id", clientId\\)`));
  assert.match(repository, /assessmentBelongs\(clientId, input\.assessmentId\)/);
  assert.match(repository, /path = `progress\/\$\{clientId\}\//);
  assert.match(repository, /scope: "CLIENT", client_id: clientId, asset_type: "progress"/);
  assert.match(repository, /async replacePhoto/);
  assert.match(repository, /\.update\(\{ asset_id: assetId, assessment_id: input\.assessmentId/);
});

test("all administrative progress writes use requireAdmin Server Actions and refresh only affected views", async () => {
  const actions = await source("src/app/(admin)/admin/clientes/actions.ts");
  assert.match(actions, /const progressService=async\(\)=>\{const \{client,user\}=await requireAdmin\(\)/);
  for (const action of ["saveProgressAssessment", "deleteProgressAssessment", "saveProgressMeasurement", "savePerformanceRecord", "uploadProgressPhoto", "replaceProgressPhoto", "deleteProgressPhoto"]) assert.match(actions, new RegExp(`export async function ${action}`));
  assert.match(actions, /revalidatePath\(`\/admin\/clientes\/\$\{id\}`\)/);
  assert.match(actions, /revalidatePath\("\/app\/evolucao"\)/);
});

test("photo removal uses an accessible React confirmation instead of a native browser dialog", async () => {
  const panel = await source("src/components/admin/client-progress.tsx");
  assert.match(panel, /function DeletePhoto/);
  assert.match(panel, /role="dialog"/);
  assert.match(panel, /Confirmar exclusão/);
  assert.match(panel, /Cancelar/);
  assert.doesNotMatch(panel, /window\.confirm\("Remover esta foto da evolução/);
});

test("admin CRM renders the real evaluation panel and client evolution only reads released own records", async () => {
  const adminPage = await source("src/app/(admin)/admin/clientes/[id]/page.tsx");
  const detail = await source("src/components/admin/client-detail.tsx");
  const evolution = await source("src/app/(client)/app/evolucao/page.tsx");
  const repository = await source("src/repositories/content-repository.ts");
  assert.match(adminPage, /createAdminProgressService\(client,user\.id\)\.list\(id\)/);
  assert.match(detail, /<AdminProgressPanel clientId=\{item\.id\} data=\{progress\}/);
  assert.match(evolution, /service\.listProgressAssessments\(\)/);
  assert.match(evolution, /As fotos incluídas pela sua equipe ficam disponíveis aqui com acesso privado/);
  assert.match(repository, /from\("progress_assessments"\).*?\.eq\("client_id", await ownClientId\(\)\)/s);
  assert.match(repository, /from\("progress_photos"\).*?\.eq\("client_id", await ownClientId\(\)\)/s);
  assert.match(repository, /assessment_id/);
});

test("client weight history is a graph generated from persisted records, not a mock placeholder", async () => {
  const component = await source("src/components/client/client-components.tsx");
  assert.match(component, /const series = \[\.\.\.weights\]\.reverse\(\)/);
  assert.match(component, /<polyline points=\{points\}/);
  assert.match(component, /progress-chart/);
});
