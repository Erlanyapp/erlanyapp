import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
import path from "node:path";
import ts from "typescript";

const require = createRequire(import.meta.url);
const root = path.resolve(import.meta.dirname, "..");
// Execute the actual TypeScript modules, not duplicate implementations of their rules.
async function moduleUrl(relative) {
  const source = await readFile(path.join(root, relative), "utf8");
  let output = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX } }).outputText;
  const imports = [...output.matchAll(/from "([^"]+)"/g)];
  for (const [, specifier] of imports) {
    if (specifier.startsWith("@/")) {
      output = output.replaceAll(`"${specifier}"`, JSON.stringify(await moduleUrl(`src/${specifier.slice(2)}.ts`)));
    } else if (!specifier.startsWith("node:")) {
      output = output.replaceAll(`"${specifier}"`, JSON.stringify(pathToFileURL(require.resolve(specifier)).href));
    }
  }
  return `data:text/javascript;base64,${Buffer.from(output).toString("base64")}`;
}
const domain = await import(await moduleUrl("src/domain/client-account.ts"));
const { createAccountService } = await import(await moduleUrl("src/services/account-service.ts"));
const { youtubeProvider } = await import(await moduleUrl("src/lib/content/video-provider.ts"));
const { createContentRepository } = await import(await moduleUrl("src/repositories/content-repository.ts"));
const { createAccountRepository } = await import(await moduleUrl("src/repositories/account-repository.ts"));
const account = { id: "owner-a", clientId: "client-a", name: "Cliente", email: "", avatarPath: null, avatarUrl: null, role: "CLIENT" };

test("profile name validation preserves identity and rejects empty/oversized input", () => {
  assert.equal(domain.validateName("  Maria Silva  "), "Maria Silva");
  for (const value of [null, "", "a", "x".repeat(101)]) assert.throws(() => domain.validateName(value));
});
test("weight accepts decimals and rejects malformed, impossible and future dates", () => {
  assert.deepEqual(domain.validateWeight("70,25", "2026-09-16", "2026-09-16"), { value: 70.25, recordedAt: "2026-09-16" });
  for (const value of ["", "0", "-1", "NaN", "Infinity", "501"]) assert.throws(() => domain.validateWeight(value, "2026-09-16"));
  for (const date of ["2026-02-30", "garbage", "2026-09-17"]) assert.throws(() => domain.validateWeight("70", date, "2026-09-16"));
});
test("avatar MIME must match signature; SVG, empty and oversized files rejected", () => {
  const png = new Uint8Array([137,80,78,71,13,10,26,10]);
  assert.equal(domain.avatarFormat(png,"image/png"),"png");
  assert.equal(domain.avatarFormat(new Uint8Array([255,216,255]),"image/jpeg"),"jpg");
  assert.equal(domain.avatarFormat(new Uint8Array(Buffer.from("RIFFxxxxWEBP")),"image/webp"),"webp");
  assert.throws(() => domain.avatarFormat(png,"image/jpeg"));
  assert.throws(() => domain.avatarFormat(new Uint8Array(Buffer.from("<svg/>")),"image/svg+xml"));
  assert.throws(() => domain.avatarFormat(new Uint8Array(),"image/png"));
  assert.throws(() => domain.avatarFormat(new Uint8Array(domain.MAX_AVATAR_BYTES+1),"image/png"));
});
test("profile paths cannot sign foreign, public URL or traversal images", () => {
  assert.equal(domain.ownAvatarPath("avatars/owner-a/a.png","owner-a"),true);
  for(const value of [null,"avatars/owner-b/a.png","avatars/owner-ab/a.png","avatars/owner-a/../b.png","https://example.com/a.png","avatars/owner-a/\\b.png"]) assert.equal(domain.ownAvatarPath(value,"owner-a"),false);
});
test("profile upload uses trusted owner and unique path; update receives metadata only", async () => {
  const calls=[];
  const service=createAccountService({ uploadAvatar: async (...args)=>calls.push(["upload",...args]), updateProfile:async (...args)=>calls.push(["update",...args]) });
  const form=new FormData(); form.set("name"," Maria "); form.set("id","foreign-owner"); form.set("role","ADMIN");
  form.set("photo",new File([new Uint8Array([137,80,78,71,13,10,26,10])],"../../secret.png",{type:"image/png"}));
  await service.saveProfile(account,form);
  assert.match(calls[0][1],/^avatars\/owner-a\/[0-9a-f-]+\.png$/);
  assert.ok(calls[0][2] instanceof Uint8Array);
  assert.deepEqual(calls[1],["update","owner-a","Maria",calls[0][1]]);
});
test("upload failure does not update profile or claim success", async () => {
  let updated=false; const service=createAccountService({uploadAvatar:async()=>{throw new Error("RLS denied");},updateProfile:async()=>{updated=true;}});
  const form=new FormData();form.set("name","Maria");form.set("photo",new File([new Uint8Array([255,216,255])],"a.jpg",{type:"image/jpeg"}));
  await assert.rejects(service.saveProfile(account,form),/RLS denied/); assert.equal(updated,false);
});
test("empty selected photo is rejected, while name-only edits preserve the old photo", async () => {
  const calls=[];const service=createAccountService({updateProfile:async(...args)=>calls.push(args)});
  const form=new FormData();form.set("name","Maria");form.set("photo",new File([],"empty.jpg",{type:"image/jpeg"}));
  await assert.rejects(service.saveProfile(account,form));assert.equal(calls.length,0);
  form.delete("photo");await service.saveProfile(account,form);assert.deepEqual(calls,[["owner-a","Maria",undefined]]);
});
test("profile save failure removes only the new orphan, never the existing photo", async () => {
  const removed=[];const uploaded=[];const service=createAccountService({uploadAvatar:async path=>uploaded.push(path),updateProfile:async()=>{throw new Error("Save failed");},removeFailedUpload:async path=>removed.push(path)});
  const form=new FormData();form.set("name","Maria");form.set("photo",new File([new Uint8Array([255,216,255])],"a.jpg",{type:"image/jpeg"}));
  await assert.rejects(service.saveProfile({...account,avatarPath:"avatars/owner-a/old.jpg"},form),/Save failed/);
  assert.deepEqual(removed,uploaded); assert.ok(!removed.includes("avatars/owner-a/old.jpg"));
});
test("weight and support writes cannot accept a forged client/sender from form fields",async()=>{
  const calls=[];const service=createAccountService({recordWeight:async(...args)=>calls.push(args),sendMessage:async(...args)=>calls.push(args)});
  const form=new FormData();form.set("weight","70");form.set("date","2026-09-15");form.set("clientId","foreign");form.set("message","Minha dúvida");form.set("senderId","foreign");
  await service.saveWeight(account,form);await service.contact(account,form);
  assert.deepEqual(calls[0],["client-a",70,"2026-09-15"]);assert.deepEqual(calls[1],[account,"Minha dúvida"]);
  form.set("message"," ");await assert.rejects(service.contact(account,form));
});
test("video adapter embeds only valid provider IDs, never internal UUIDs or URLs",()=>{
  assert.equal(youtubeProvider.getEmbedSource({providerVideoId:"dQw4w9WgXcQ"}),"https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ");
  for(const id of ["", "https://evil.test", "00000000-0000-0000-0000-000000000000", "../bad"]) assert.equal(youtubeProvider.getEmbedSource({providerVideoId:id}),"");
});
function infrastructure(rows, storageError = null) {
  const calls=[];let authCalls=0;let signCalls=0;
  const client={auth:{getUser:async()=>{authCalls++;return {data:{user:{id:"user-a"}},error:null};}},from(table){
    const query={select(...args){calls.push([table,"select",...args]);return this;},eq(...args){calls.push([table,"eq",...args]);return this;},or(...args){calls.push([table,"or",...args]);return this;},order(){return this;},single(){return Promise.resolve({data:rows[table]?.[0]??{id:"client-a"},error:null});},then(resolve){return Promise.resolve({data:rows[table]??[],error:null}).then(resolve);}};
    return query;
  },storage:{from(){return {createSignedUrl:async()=>{signCalls++;return {data:storageError?null:{signedUrl:"signed-private-image"},error:storageError};}};}}};
  return {client,calls,authCalls:()=>authCalls,signCalls:()=>signCalls};
}
test("all progress reads explicitly use authenticated ownership, including ADMIN client views",async()=>{
  const infra=infrastructure({clients:[{id:"client-a"}]});const repository=createContentRepository(infra.client);
  await Promise.all([repository.listProgressWeights(),repository.listProgressMeasurements(),repository.listProgressPhotos(),repository.listPerformanceRecords()]);
  for(const table of ["progress_weights","progress_measurements","progress_photos","performance_records"])assert.ok(infra.calls.some(call=>JSON.stringify(call)===JSON.stringify([table,"eq","client_id","client-a"])));
  assert.equal(infra.authCalls(),1);
});
test("scoped content reads restrict GLOBAL or the authenticated CLIENT, never every client",async()=>{
  const infra=infrastructure({clients:[{id:"client-a"}]});const repository=createContentRepository(infra.client);
  await Promise.all([repository.listWorkouts(),repository.listExercises(),repository.listVideos(),repository.listTips(),repository.listNutritionPlans(),repository.listRecipes(),repository.listNutritionMeals("plan-a")]);
  for(const table of ["workouts","exercises","videos","tips","nutrition_plans","recipes","nutrition_meals"])assert.ok(infra.calls.some(call=>JSON.stringify(call)===JSON.stringify([table,"or","scope.eq.GLOBAL,and(scope.eq.CLIENT,client_id.eq.client-a)"])));
});
test("private image signing failure is an error, not a misleading empty success",async()=>{
  const infra=infrastructure({clients:[{id:"client-a"}],progress_photos:[{id:"photo-a",asset:{bucket:"images",path:"progress/client-a/a.jpg"}}]},new Error("Storage denied"));
  await assert.rejects(createContentRepository(infra.client).listProgressPhotos(),/Storage denied/);
});
test("profile signs own path only and uses app_metadata, not editable metadata, for roles",async()=>{
  const infra=infrastructure({profiles:[{full_name:"Maria",avatar_url:"avatars/user-b/a.jpg"}],clients:[{id:"client-a"}]});
  const profile=await createAccountRepository(infra.client).account({id:"user-a",email:"",app_metadata:{},user_metadata:{role:"ADMIN"}});
  assert.equal(profile.role,"CLIENT");assert.equal(profile.avatarUrl,null);assert.equal(profile.avatarError,true);assert.equal(infra.signCalls(),0);
});
test("recipe ingredients reuse normalized relation with JSON fallback",async()=>{
  const infra=infrastructure({clients:[{id:"client-a"}],recipes:[{id:"r1",recipe_ingredients:[{name:"B",quantity:"2",ingredient_order:2},{name:"A",ingredient_order:1}],ingredients:[{name:"legacy"}]},{id:"r2",recipe_ingredients:[],ingredients:[{name:"legacy",quantity:"1"}]}]});
  const recipes=await createContentRepository(infra.client).listRecipes();assert.deepEqual(recipes[0].ingredients,[{name:"A",quantity:undefined},{name:"B",quantity:"2"}]);assert.deepEqual(recipes[1].ingredients,[{name:"legacy",quantity:"1"}]);
});
