import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const source = (relative) => readFile(path.join(root, relative), "utf8");

test("progress assessment foundation preserves the existing histories through optional links", async () => {
  const migration = await source("supabase/migrations/20261009120000_progress_assessments_foundation.sql");
  assert.match(migration, /create table if not exists public\.progress_assessments/);
  assert.match(migration, /client_id uuid not null references public\.clients\(id\) on delete cascade/);
  assert.match(migration, /assessed_at date not null/);
  assert.match(migration, /assessed_by uuid references auth\.users\(id\) on delete set null/);
  for (const table of ["progress_weights", "progress_measurements", "progress_photos", "performance_records"]) {
    assert.match(migration, new RegExp(`alter table public\\.${table}[\\s\\S]*?add column if not exists assessment_id uuid references public\\.progress_assessments\\(id\\) on delete set null`));
  }
  assert.doesNotMatch(migration, /delete from public\.progress_/i);
  assert.doesNotMatch(migration, /update public\.progress_/i);
});

test("assessments are owner-readable and ADMIN-managed without granting CLIENT writes", async () => {
  const migration = await source("supabase/migrations/20261009120000_progress_assessments_foundation.sql");
  const grants = await source("supabase/migrations/20261009123000_harden_progress_assessment_grants.sql");
  assert.match(migration, /alter table public\.progress_assessments enable row level security/);
  assert.match(migration, /admin full access progress assessments[\s\S]*?auth\.jwt\(\) -> 'app_metadata' ->> 'role'\) = 'ADMIN'/);
  assert.match(migration, /clients read own progress assessments[\s\S]*?client_id in \([\s\S]*?user_id = \(select auth\.uid\(\)\)/);
  assert.doesNotMatch(migration, /create policy "clients write progress assessments"/);
  assert.match(migration, /revoke all on table public\.progress_assessments from anon, public/);
  assert.match(grants, /revoke all on table public\.progress_assessments from authenticated/);
  assert.match(grants, /grant select, insert, update, delete on table public\.progress_assessments to authenticated/);
});

test("progress photo assets must remain private progress media owned by the same client", async () => {
  const migration = await source("supabase/migrations/20261009120000_progress_assessments_foundation.sql");
  const triggerFix = await source("supabase/migrations/20261009124000_fix_progress_photo_asset_trigger.sql");
  assert.match(migration, /asset_scope <> 'CLIENT'/);
  assert.match(migration, /asset_client_id is distinct from new\.client_id/);
  assert.match(migration, /asset_type <> 'progress'/);
  assert.match(migration, /before insert or update of client_id, asset_id on public\.progress_photos/);
  assert.match(migration, /foreign key \(asset_id\) references public\.media_assets\(id\) on delete restrict/);
  assert.match(migration, /before update of client_id, scope, asset_type on public\.media_assets/);
  assert.match(triggerFix, /asset\.asset_type[\s\S]*?stored_asset_type/);
  assert.match(triggerFix, /stored_asset_type <> 'progress'/);
});

test("existing client weight registration remains compatible with the optional assessment foundation", async () => {
  const repository = await source("src/repositories/account-repository.ts");
  const interactions = await source("supabase/migrations/20260916122122_client_functional_interactions.sql");
  assert.match(repository, /progress_weights"\)\.insert\(\{ client_id: clientId, value, recorded_at: recordedAt \}\)/);
  assert.match(interactions, /create policy "own weight insert" on public\.progress_weights/);
});
