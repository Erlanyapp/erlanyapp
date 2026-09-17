import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import path from "node:path";

const root=process.cwd();

test("exercise category is mandatory and filters preserve category IDs",async()=>{
  const source=await readFile(path.join(root,"src/domain/admin-exercise.ts"),"utf8"),repository=await readFile(path.join(root,"src/repositories/admin-exercise-repository.ts"),"utf8");
  assert.match(source,/if\(!categoryId\)throw new Error\("Selecione uma categoria\."\)/);
  assert.match(source,/categoryId:p\.category==="all"\?null:uuid\(p\.category\)/);
  assert.match(repository,/from\("exercise_categories"\)\.select\("id,name"\)/);
});

test("exercise form keeps an invalid category placeholder and receives repository categories",async()=>{
  const form=await readFile(path.join(root,"src/components/admin/exercise-form.tsx"),"utf8"),page=await readFile(path.join(root,"src/app/(admin)/admin/exercicios/[id]/page.tsx"),"utf8");
  assert.match(form,/<option value="" disabled>Selecione<\/option>/);
  assert.match(form,/categories\.map/);
  assert.match(page,/s\.categories\(\)/);
});

test("thumbnail is explicitly optional and validates only a selected non-empty File",async()=>{
  const domain=await readFile(path.join(root,"src/domain/admin-exercise.ts"),"utf8"),service=await readFile(path.join(root,"src/services/admin-exercise-service.ts"),"utf8");
  assert.match(domain,/if\(!isSelectedFile\(value\)\)return null/);
  assert.match(domain,/value\.size>MAX_EXERCISE_THUMBNAIL_BYTES/);
  assert.match(domain,/Use uma imagem PNG, JPG ou WebP/);
  assert.match(service,/const thumbnail=await exerciseThumbnail\(form\.get\("thumbnail"\)\)/);
  assert.match(service,/if\(thumbnail\)/);
});

test("saving without a thumbnail persists null implicitly, while a selected thumbnail creates metadata",async()=>{
  const service=await readFile(path.join(root,"src/services/admin-exercise-service.ts"),"utf8");
  assert.match(service,/thumbnail_asset_id:assetId/);
  assert.match(service,/video_id:video\?\.id\?\?null/);
  assert.doesNotMatch(service,/thumbnail_asset_id:null/);
});

test("video-only and thumbnail-only saves retain compensating cleanup on failures",async()=>{
  const service=await readFile(path.join(root,"src/services/admin-exercise-service.ts"),"utf8"),repository=await readFile(path.join(root,"src/repositories/admin-exercise-repository.ts"),"utf8");
  assert.match(service,/if\(assetId\)await r\.removeThumbnailAsset/);
  assert.match(service,/if\(path\)await r\.removeUpload/);
  assert.match(service,/if\(video\?\.created\)await r\.removeVideo/);
  assert.match(repository,/created:false/);
  assert.match(repository,/created:true/);
});

test("form keeps controlled values on failures and resets its file input only after success",async()=>{
  const form=await readFile(path.join(root,"src/components/admin/exercise-form.tsx"),"utf8");
  assert.match(form,/value=\{values\.name\}/);
  assert.match(form,/value=\{values\.videoUrl\}/);
  assert.match(form,/if\(!state\.success\)return/);
  assert.match(form,/fileRef\.current\.value=""/);
  assert.match(form,/thumbnailError\?\?state\.thumbnailError/);
});

test("exercise creation supplies the required unique slug while edits preserve the existing slug",async()=>{
  const domain=await readFile(path.join(root,"src/domain/admin-exercise.ts"),"utf8"),service=await readFile(path.join(root,"src/services/admin-exercise-service.ts"),"utf8"),actions=await readFile(path.join(root,"src/app/(admin)/admin/exercicios/actions.ts"),"utf8");
  assert.match(domain,/export function exerciseSlug/);
  assert.match(service,/!id\?\{slug:`\$\{exerciseSlug\(x\.name\)\}-\$\{randomUUID\(\)\.slice\(0,8\)\}`\}:\{\}/);
  assert.match(actions,/admin\.exercise\.save_failed/);
  assert.match(actions,/code:error\.code/);
});

test("list renders private signed thumbnail URLs without the Next image optimizer",async()=>{
  const library=await readFile(path.join(root,"src/components/admin/exercise-library.tsx"),"utf8"),repository=await readFile(path.join(root,"src/repositories/admin-exercise-repository.ts"),"utf8");
  assert.match(library,/<Image src=\{item\.thumbnailUrl\} alt="" width=\{52\} height=\{52\} unoptimized\/>/);
  assert.match(repository,/createSignedUrl\(String\(a\.path\),900\)/);
});

test("exercise library uses a desktop table and semantic cards instead of squeezing columns on mobile",async()=>{
  const library=await readFile(path.join(root,"src/components/admin/exercise-library.tsx"),"utf8"),actions=await readFile(path.join(root,"src/components/admin/exercise-actions.tsx"),"utf8"),css=await readFile(path.join(root,"src/app/(admin)/admin-crm.css"),"utf8");
  assert.match(library,/exercise-desktop-table/);
  assert.match(library,/exercise-mobile-list/);
  assert.match(library,/exercise-card/);
  assert.match(library,/ExerciseActions id=\{item\.id\}/);
  assert.match(actions,/aria-label=\{`\$\{active/);
  assert.match(css,/\.exercise-table \{ min-width:1000px; table-layout:fixed/);
  assert.match(css,/@media \(max-width:1160px\) \{ \.admin-viewport \.exercise-desktop-table \{ display:none/);
  assert.match(css,/exercise-card dl \{ display:grid; grid-template-columns:repeat\(3,minmax\(0,1fr\)\)/);
});

test("exercise activation sends the inverse state, confirms the persisted row and refreshes the list",async()=>{
  const actions=await readFile(path.join(root,"src/components/admin/exercise-actions.tsx"),"utf8"),serverAction=await readFile(path.join(root,"src/app/(admin)/admin/exercicios/actions.ts"),"utf8"),repository=await readFile(path.join(root,"src/repositories/admin-exercise-repository.ts"),"utf8");
  assert.match(actions,/toggleExercise\(id,!active\)/);
  assert.match(actions,/setActive\(result\.active\)/);
  assert.match(actions,/router\.refresh\(\)/);
  assert.match(serverAction,/const \{client\}=await requireAdmin\(\)/);
  assert.match(serverAction,/return \{active:updated\}/);
  assert.match(repository,/update\(\{is_active:isActive\}\)\.eq\("id",id\)\.select\("id,is_active"\)\.single\(\)/);
  assert.match(repository,/data\.is_active!==isActive/);
});
