import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import ts from "typescript";

const root=path.resolve(import.meta.dirname,"..");
const source=relative=>readFile(path.join(root,relative),"utf8");
const url=code=>`data:text/javascript;base64,${Buffer.from(code).toString("base64")}`;
async function moduleUrl(relative) {
  let output=ts.transpileModule(await source(relative),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
  for(const [,specifier] of [...output.matchAll(/from "([^"]+)"/g)]) {
    const dependency=specifier.startsWith("@/")?`src/${specifier.slice(2)}.ts`:path.join(path.dirname(relative),`${specifier}.ts`);
    output=output.replaceAll(`"${specifier}"`,JSON.stringify(await moduleUrl(dependency)));
  }
  return url(output);
}
const domain=await import(await moduleUrl("src/domain/admin-client.ts"));
const {createAdminRepository}=await import(await moduleUrl("src/repositories/admin-repository.ts"));
const {createAdminService}=await import(await moduleUrl("src/services/admin-service.ts"));
const id="00000000-0000-0000-0000-000000000001",userId="00000000-0000-0000-0000-000000000002";
const row={id,user_id:userId,status:"active",created_at:"2026-09-16T00:00:00Z",updated_at:"version",profile:{full_name:"Test fixture",email:"fixture@example.invalid",updated_at:"version",avatar_url:`avatars/${userId}/a.png`},plan:null};
function infrastructure({error=null,rangeError=null,total=41,avatar=row.profile.avatar_url}={}) {
  const calls=[];
  return {calls,client:{from(table){let writing=false,head=false;const q={
    select(...args){head=!!args[1]?.head;calls.push([table,"select",...args]);return q;},
    update(...args){writing=true;calls.push([table,"update",...args]);return q;},
    eq(...args){calls.push([table,"eq",...args]);return q;},
    gte(...args){calls.push([table,"gte",...args]);return q;},lt(...args){calls.push([table,"lt",...args]);return q;},
    order(...args){calls.push([table,"order",...args]);return q;},or(...args){calls.push([table,"or",...args]);return q;},
    range(...args){calls.push([table,"range",...args]);return q;},
    maybeSingle:async()=>({data:writing?{id}:{...row,profile:{...row.profile,avatar_url:avatar}},error}),
    then(resolve,reject){return Promise.resolve({data:head?null:[{...row,profile:{...row.profile,avatar_url:avatar}}],count:!head&&rangeError?null:total,error:error??(!head?rangeError:null)}).then(resolve,reject);}
  };return q;},storage:{from(bucket){return {createSignedUrls:async paths=>{calls.push([bucket,"sign",paths]);return {data:paths.map(path=>({path,signedUrl:"private-signed-fixture"})),error:null};}};}}}};
}
test("CRM validates identity, tab and status allowlists",()=>{
  assert.equal(domain.adminClientId(id),id);
  for(const invalid of [null,"../secret","not-a-uuid",[id]])assert.throws(()=>domain.adminClientId(invalid));
  assert.equal(domain.clientTab("perfil"),"perfil");assert.equal(domain.clientTab("unsupported"),"visao-geral");
  assert.equal(domain.nextClientStatus("active"),"inactive");assert.equal(domain.nextClientStatus("inactive"),"active");assert.throws(()=>domain.nextClientStatus("ADMIN"));
});
test("CRM filters use bounded pages, strict dates and inclusive end date",()=>{
  const f=domain.clientListFilters({page:"2",status:"inactive",plan:id,from:"2026-09-01",to:"2026-09-16"});
  assert.equal(f.pageSize,20);assert.equal(f.page,2);assert.equal(f.until,"2026-09-17T03:00:00.000Z");assert.equal(f.planId,id);
  assert.equal(domain.clientListFilters({page:"-2",status:"ADMIN"}).page,1);
  assert.equal(domain.clientListFilters({page:"5001"}).page,5001);
  for(const params of [{from:"2026-02-30"},{from:"2026-09-17",to:"2026-09-16"},{plan:"bad"},{page:"100001"}])assert.throws(()=>domain.clientListFilters(params));
});
test("search cannot inject PostgREST comma expressions or wildcards",()=>{
  const f=domain.clientListFilters({q:' x%,full_name.eq.ADMIN_()"\\ '});
  assert.doesNotMatch(f.search,/[,%_()*"\\]/);assert.equal(domain.clientListFilters({q:"x".repeat(200)}).search.length,100);
});
test("repository pagination is inclusive, stable and performed in database",async()=>{
  const i=infrastructure();await createAdminRepository(i.client).listClients(domain.clientListFilters({page:"2",q:"Fixture",status:"active",plan:id}));
  assert.ok(i.calls.some(c=>JSON.stringify(c)===JSON.stringify(["clients","range",20,39])));
  assert.ok(i.calls.some(c=>c[1]==="select"&&c[2].includes("profiles!clients_profile_fkey!inner")));
  assert.ok(i.calls.some(c=>c[1]==="or"&&c[3].referencedTable==="profile"));
  assert.deepEqual(i.calls.filter(c=>c[1]==="order").map(c=>c[2]),["created_at","id"]);
});
test("query failure is not presented as an empty client list",async()=>{
  const i=infrastructure({error:new Error("Query denied")});await assert.rejects(createAdminRepository(i.client).listClients(domain.clientListFilters({})),/Query denied/);
});
test("out-of-range pages recount identical filters without masking other failures",async()=>{
  const params=domain.clientListFilters({page:"2",q:"Fixture",status:"active"});
  const i=infrastructure({rangeError:{code:"PGRST103"},total:3});
  const result=await createAdminRepository(i.client).listClients(params);
  assert.equal(result.total,3);assert.equal(result.clients.length,0);
  assert.equal(i.calls.filter(c=>c[1]==="or").length,2);
  assert.equal(i.calls.filter(c=>c[1]==="eq"&&c[2]==="status").length,2);
  assert.ok(i.calls.some(c=>c[1]==="select"&&c[3].head));
  const inconsistent=infrastructure({rangeError:{code:"PGRST103"},total:41});
  await assert.rejects(createAdminRepository(inconsistent.client).listClients(params));
});
test("ADMIN signing still validates avatar path against actual client owner",async()=>{
  const i=infrastructure({avatar:"avatars/foreign/a.png"});const result=await createAdminRepository(i.client).listClients(domain.clientListFilters({}));
  assert.equal(result.clients[0].avatarUrl,null);assert.equal(result.clients[0].avatarError,true);assert.ok(!i.calls.some(c=>c[1]==="sign"));
});
test("profile mutation resolves owner in database and ignores forged identity/role/email",async()=>{
  const i=infrastructure(),form=new FormData();form.set("name","Actual name");form.set("updatedAt","version");form.set("userId","foreign");form.set("role","ADMIN");form.set("email","attacker@example.invalid");
  await createAdminService(i.client).saveProfile(id,form);
  assert.deepEqual(i.calls.find(c=>c[1]==="update"),["profiles","update",{full_name:"Actual name"}]);
  assert.ok(i.calls.some(c=>JSON.stringify(c)===JSON.stringify(["profiles","eq","id",userId])));
  assert.ok(i.calls.some(c=>JSON.stringify(c)===JSON.stringify(["profiles","eq","updated_at","version"])));
  assert.ok(!i.calls.some(c=>c[1]==="sign"||c[0]==="progress_weights"));
});
test("stale or invalid profile edits fail before any write",async()=>{
  const i=infrastructure(),form=new FormData();form.set("name","Actual name");form.set("updatedAt","old-version");
  await assert.rejects(createAdminService(i.client).saveProfile(id,form),/perfil mudou/);assert.ok(!i.calls.some(c=>c[1]==="update"));
  form.set("updatedAt","version");form.set("name"," ");await assert.rejects(createAdminService(i.client).saveProfile(id,form));assert.ok(!i.calls.some(c=>c[1]==="update"));
});
test("status mutation preserves identity and uses optimistic previous status",async()=>{
  const i=infrastructure();await createAdminService(i.client).toggleStatus(id,"active");
  assert.deepEqual(i.calls.find(c=>c[1]==="update"),["clients","update",{status:"inactive"}]);
  assert.ok(i.calls.some(c=>JSON.stringify(c)===JSON.stringify(["clients","eq","status","active"])));
  const stale=infrastructure();await assert.rejects(createAdminService(stale.client).toggleStatus(id,"inactive"),/Recarregue/);assert.ok(!stale.calls.some(c=>c[1]==="update"));
});
async function guard(user) {
  let output=ts.transpileModule(await source("src/lib/supabase/admin.ts"),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
  output=output.replaceAll('"next/navigation"',JSON.stringify(url('export function redirect(path){throw new Error("REDIRECT:"+path)}')));
  output=output.replaceAll('"@/lib/supabase/server"',JSON.stringify(url(`export async function createSupabaseServerClient(){return {auth:{getUser:async()=>({data:{user:${JSON.stringify(user)}}})}}}`)));
  return (await import(url(output))).requireAdmin();
}
test("server guard allows only verified Auth app_metadata ADMIN",async()=>{
  assert.equal((await guard({id,app_metadata:{role:"ADMIN"}})).user.id,id);
  for(const user of [{id,app_metadata:{role:"CLIENT"}},{id,user_metadata:{role:"ADMIN"}},{id,app_metadata:{}}])await assert.rejects(guard(user),/REDIRECT:\/app\/inicio/);
  await assert.rejects(guard(null),/REDIRECT:\/login/);
});
test("every CRM mutation authenticates outside its error-catching block",async()=>{
  const actions=await source("src/app/(admin)/admin/clientes/actions.ts");
  assert.equal((actions.match(/const \{client\}=await requireAdmin\(\);/g)??[]).length,3);
  assert.match(actions,/createAdminClient[\s\S]*?requireAdmin\(\);\s*let clientId:string;\s*try/);
  for(const file of ["client-detail.tsx","client-profile-form.tsx","client-table.tsx","client-filters.tsx"]){const s=await source(`src/components/admin/${file}`);assert.doesNotMatch(s,/\.from\(|service_role|SUPABASE_SERVICE_ROLE/);}
});
test("error recovery clears filters with a document navigation to reset the boundary",async()=>{
  const error=await source("src/app/(admin)/admin/clientes/error.tsx");
  assert.match(error,/<form action="\/admin\/clientes" method="get">/);
  assert.doesNotMatch(error,/<Link /);
});
