import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import path from "node:path";
import ts from "typescript";
const root=path.resolve(import.meta.dirname,"..");
const source=file=>readFile(path.join(root,file),"utf8");
const url=code=>`data:text/javascript;base64,${Buffer.from(code).toString("base64")}`;
async function load(file) {
  let code=ts.transpileModule(await source(file),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
  for(const [,specifier] of [...code.matchAll(/from "([^"]+)"/g)]) {
    const target=specifier.startsWith("@/")?`src/${specifier.slice(2)}.ts`:path.join(path.dirname(file),specifier.endsWith(".ts")?specifier:`${specifier}.ts`);
    code=code.replaceAll(JSON.stringify(specifier),JSON.stringify(await load(target)));
  }
  return url(code);
}
const {clientRegistration}=await import(await load("supabase/functions/_shared/client-registration.ts"));
const {registrationHandler}=await import(await load("supabase/functions/admin-create-client/handler.ts"));
const {createAdminClientRecordsRepository}=await import(await load("src/repositories/admin-client-records-repository.ts"));
const {createAdminService}=await import(await load("src/services/admin-service.ts"));
const {clientListFilters}=await import(await load("src/domain/admin-client.ts"));
const id="00000000-0000-0000-0000-000000000001",userId="00000000-0000-0000-0000-000000000002";
// Isolated unit fixtures only; no synthetic clients are inserted into production.
const valid={name:"Unit fixture",email:"unit@example.invalid",password:"UnitOnlyPassword12",confirmed:true};
function edge({user={id:userId,email:"erlanyoliveira95@gmail.com",app_metadata:{role:"ADMIN"}},error=null,createdError=null}={}) {
  const calls=[];
  const handler=registrationHandler({viewer:()=>({auth:{getUser:async token=>{calls.push(["verify",token]);return {data:{user},error};}}}),
    administrator:()=>{calls.push(["privileged"]);return {auth:{admin:{createUser:async data=>{calls.push(["create",data]);return {data:{user:{id,app_metadata:{role:"CLIENT"}}},error:createdError};}}},
      from:table=>({select:()=>({eq:()=>({single:async()=>({data:table==="profiles"?{role:"CLIENT"}:{id},error:null})})})})};}});
  return {handler,calls};
}
const request=(body=valid,token="unit-jwt")=>new Request("https://example.invalid",{method:"POST",headers:{"content-type":"application/json",...(token?{authorization:`Bearer ${token}`}:{})},body:JSON.stringify(body)});
test("registration filters match the displayed Sao Paulo calendar, including historical DST",()=>{
  const today=clientListFilters({from:"2026-09-16",to:"2026-09-16"});
  assert.equal(today.fromDate,"2026-09-16T03:00:00.000Z");assert.equal(today.until,"2026-09-17T03:00:00.000Z");
  const gap=clientListFilters({from:"2018-11-04",to:"2018-11-04"});
  assert.equal(gap.fromDate,"2018-11-04T03:00:00.000Z");assert.equal(gap.until,"2018-11-05T02:00:00.000Z");
});
test("creation validates data and cannot accept forged managed metadata",()=>{
  assert.deepEqual(clientRegistration({...valid,role:"ADMIN",app_metadata:{role:"ADMIN"},userId:id}),{name:valid.name,email:valid.email,password:valid.password});
  for(const bad of [{name:"x"},{email:"bad"},{email:"erlanyoliveira95@gmail.com"},{password:"weak"},{confirmed:false}])assert.throws(()=>clientRegistration({...valid,...bad}));
});
test("Edge Function verifies identity and current managed role before privileged access",async()=>{
  for(const user of [null,{id,email:"erlanyoliveira95@gmail.com",user_metadata:{role:"ADMIN"}},{id,email:"other@example.invalid",app_metadata:{role:"ADMIN"}},{id,email:valid.email,app_metadata:{role:"CLIENT"}}]) {
    const i=edge({user});const r=await i.handler(request());assert.ok([401,403].includes(r.status));assert.ok(!i.calls.some(x=>x[0]==="privileged"));
  }
  const missing=edge();assert.equal((await missing.handler(request(valid,""))).status,401);assert.equal(missing.calls.length,0);
});
test("real registration handler delegates password only to Auth and fixes CLIENT role",async()=>{
  const i=edge();const r=await i.handler(request({...valid,role:"ADMIN",metadata:{role:"ADMIN"}}));assert.equal(r.status,201);
  const body=await r.json();assert.equal(body.clientId,id);assert.doesNotMatch(JSON.stringify(body),new RegExp(valid.password));
  const created=i.calls.find(x=>x[0]==="create")[1];assert.deepEqual(created.app_metadata,{role:"CLIENT",crm_created_by:userId});assert.deepEqual(created.user_metadata,{full_name:valid.name});
  assert.equal(created.email_confirm,true);assert.equal(created.password,valid.password);
});
test("duplicate identity is reported without overwriting any existing account",async()=>{
  const i=edge({createdError:{code:"email_exists",message:"upstream private error"}});const r=await i.handler(request());assert.equal(r.status,409);
  const output=JSON.stringify(await r.json());assert.match(output,/nenhuma conta foi alterada/);assert.doesNotMatch(output,/upstream private/);
});
test("invalid payload and oversized body fail before any privileged write",async()=>{
  const i=edge();assert.equal((await i.handler(request({...valid,password:"weak"}))).status,400);
  assert.equal((await i.handler(request({...valid,name:"x".repeat(17000)}))).status,413);
  assert.ok(!i.calls.some(x=>x[0]==="privileged"));
});
test("creation service forwards only validated fields and propagates function failures",async()=>{
  const calls=[],form=new FormData();for(const [key,value] of Object.entries(valid))form.set(key,key==="confirmed"?"on":value);
  form.set("role","ADMIN");form.set("planId",id);
  const client={functions:{invoke:async (name,options)=>{calls.push([name,options.body]);return {data:{clientId:id},error:null};}}};
  assert.equal(await createAdminService(client).createClient(form),id);
  assert.deepEqual(calls,[["admin-create-client",valid]]);
  client.functions.invoke=async()=>({data:null,error:{context:Response.json({error:"Cadastro recusado"},{status:409})}});
  await assert.rejects(createAdminService(client).createClient(form),/Cadastro recusado/);
  form.set("password","weak");calls.length=0;await assert.rejects(createAdminService(client).createClient(form),/senha inicial/);assert.equal(calls.length,0);
});
function records({tables={},error=null,rangeError=null,signError=null}={}) {
  const calls=[];
  const client={from(table){let head=false;const q={
    select(...args){head=!!args[1]?.head;calls.push([table,"select",...args]);return q;},eq(...args){calls.push([table,"eq",...args]);return q;},
    order(...args){calls.push([table,"order",...args]);return q;},range(...args){calls.push([table,"range",...args]);return q;},
    then(resolve,reject){return Promise.resolve({data:head?null:tables[table]??[],error:error??(!head?rangeError:null),count:!head&&rangeError?null:(tables[table]??[]).length}).then(resolve,reject);}};return q;},
    storage:{from:bucket=>({createSignedUrl:async (...args)=>{calls.push([bucket,"sign",...args]);return {data:signError?null:{signedUrl:"private-unit-signed"},error:signError};}})}};
  return {client,calls};
}
test("all five tabs query only target client and perform bounded database pagination",async()=>{
  for(const tab of ["treinos","alimentacao","evolucao","midia","historico"]) {
    const i=records();const data=await createAdminClientRecordsRepository(i.client).getRecords(id,tab,2);assert.equal(data.page,2);
    for(const table of new Set(i.calls.map(x=>x[0]))) {
      assert.ok(i.calls.some(x=>x[0]===table&&x[1]==="eq"&&x[2]===(table==="audit_logs"?"entity_id":"client_id")&&x[3]===id));
      assert.ok(i.calls.some(x=>x[0]===table&&x[1]==="range"&&x[2]===20&&x[3]===39));
    }
    if(["alimentacao","midia"].includes(tab))assert.ok(i.calls.some(x=>x[1]==="eq"&&x[2]==="scope"&&x[3]==="CLIENT"));
    for(const group of data.groups){assert.equal(group.records.length,0);assert.equal(group.total,0);assert.ok(group.empty);}
  }
});
test("real field mappings preserve recorded weight and do not fabricate absent fields",async()=>{
  const i=records({tables:{progress_weights:[{id,value:"62.5",recorded_at:"2026-09-16"}]}});
  const data=await createAdminClientRecordsRepository(i.client).getRecords(id,"evolucao",1);
  assert.equal(data.groups[0].records[0].title,"62,5 kg");assert.equal(data.groups[0].records[0].date,"2026-09-16");assert.equal(data.groups[1].total,0);
});
test("tab range recovery preserves assignment ownership on the recount",async()=>{
  const i=records({rangeError:{code:"PGRST103"}});
  const result=await createAdminClientRecordsRepository(i.client).getRecords(id,"treinos",2);
  assert.equal(result.groups[0].total,0);assert.equal(result.groups[0].records.length,0);
  assert.equal(i.calls.filter(x=>x[1]==="eq"&&x[2]==="client_id"&&x[3]===id).length,2);
  assert.equal(i.calls.filter(x=>x[1]==="eq"&&x[2]==="scope"&&x[3]==="CLIENT").length,0);
});
test("training records are sourced from assignments, not the legacy workout client_id field",async()=>{
  const i=records({tables:{workout_assignments:[{id:"assignment-a",starts_on:"2026-09-18",ends_on:"2026-10-18",is_active:true,created_at:"2026-09-18T00:00:00Z",workout:{id:"workout-a",name:"Treino de Pernas",status:"draft",is_active:true,duration_minutes:45},schedule:[{weekday:0,schedule_kind:"WORKOUT"}]}]}});
  const data=await createAdminClientRecordsRepository(i.client).getRecords(id,"treinos",1);
  const record=data.groups[0].records[0];
  assert.equal(record.title,"Treino de Pernas");
  assert.equal(record.fields.find(field=>field.label==="Situação da atribuição")?.value,"Ativa");
  assert.equal(record.fields.find(field=>field.label==="Dias configurados")?.value,"1");
  assert.ok(i.calls.some(call=>call[0]==="workout_assignments"&&call[1]==="eq"&&call[2]==="client_id"&&call[3]===id));
  assert.ok(!i.calls.some(call=>call[0]==="workouts"));
});
test("associated files use private signed URLs; signing errors are not empty states",async()=>{
  const tables={media_assets:[{id,title:"Private fixture",bucket:"images",path:"clients/unit/fixture.png"}]};
  const i=records({tables});const data=await createAdminClientRecordsRepository(i.client).getRecords(id,"midia",1);
  assert.equal(data.groups[0].records[0].imageUrl,"private-unit-signed");assert.ok(i.calls.some(x=>x[1]==="sign"&&x[3]===900));
  const fail=records({tables,signError:new Error("denied")});const failed=await createAdminClientRecordsRepository(fail.client).getRecords(id,"midia",1);assert.equal(failed.groups[0].total,1);assert.equal(failed.groups[0].records[0].imageError,true);
});
test("history selects no passwords/email/old or new personal values and is client-scoped",async()=>{
  const i=records({tables:{audit_logs:[{id,action:"client_created",created_at:"2026-09-16T00:00:00Z"}]}});const data=await createAdminClientRecordsRepository(i.client).getRecords(id,"historico",1);
  assert.equal(data.groups[0].records[0].title,"Cliente criado pelo Admin");assert.equal(i.calls.find(x=>x[1]==="select")[2],"id,action,created_at");
  assert.ok(i.calls.some(x=>x[1]==="eq"&&x[2]==="entity"&&x[3]==="clients"));
});
test("tab query failures surface as errors, not successful empty records",async()=>{
  const i=records({error:new Error("private SQL")});await assert.rejects(createAdminClientRecordsRepository(i.client).getRecords(id,"treinos",1),/Não foi possível consultar/);
  assert.throws(()=>createAdminService(i.client).getRecords(id,"evolucao","0"),/Página de registros/);
});
test("clear filters submits a separate empty native GET form, not the populated filter form",async()=>{
  const code=await source("src/components/admin/client-filters.tsx");assert.match(code,/form="crm-clear-filters"/);assert.match(code,/<form id="crm-clear-filters" action="\/admin\/clientes" method="get" hidden\//);
});
test("Edge implementation passes a separate strict TypeScript check with pinned Supabase types",()=>{
  const options={strict:true,noEmit:true,skipLibCheck:true,target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext,moduleResolution:ts.ModuleResolutionKind.Bundler,allowImportingTsExtensions:true};
  const shim=path.join(root,"virtual-edge-runtime.d.ts"),host=ts.createCompilerHost(options),getSource=host.getSourceFile.bind(host);
  host.getSourceFile=(file,version,...args)=>file===shim?ts.createSourceFile(file,"declare const Deno: {env:{get(name:string):string|undefined};serve(handler:(request:Request)=>Promise<Response>):void};",version):getSource(file,version,...args);
  host.resolveModuleNames=(names,containing)=>names.map(name=>ts.resolveModuleName(name.startsWith("npm:")?"@supabase/supabase-js":name,containing,options,ts.sys).resolvedModule);
  const program=ts.createProgram([path.join(root,"supabase/functions/admin-create-client/index.ts"),shim],options,host);
  const diagnostics=ts.getPreEmitDiagnostics(program);assert.equal(diagnostics.length,0,ts.formatDiagnosticsWithColorAndContext(diagnostics,{getCanonicalFileName:x=>x,getCurrentDirectory:()=>root,getNewLine:()=>"\n"}));
});
