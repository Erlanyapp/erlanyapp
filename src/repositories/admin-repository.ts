import type { SupabaseClient } from "@supabase/supabase-js";
import type { AdminClient,AdminClientDetail,AdminMetrics } from "@/types/admin";
import { ownAvatarPath } from "@/domain/client-account";
import type { clientListFilters } from "@/domain/admin-client";
import { readAdminPage } from "./admin-page";
type Row=Record<string,unknown>;
const selectClient="id,user_id,status,plan_id,last_access_at,created_at,updated_at,profile:profiles!clients_profile_fkey!inner(full_name,email,avatar_url,updated_at),plan:plans!clients_plan_id_fkey(name)";
const toClient=(row:Row):AdminClient=>{
  const p=row.profile as Row,plan=row.plan as Row|null;
  return {id:String(row.id),userId:String(row.user_id),fullName:p.full_name as string|null,email:p.email as string|null,
    avatarPath:p.avatar_url as string|null,avatarUrl:null,avatarError:false,profileUpdatedAt:String(p.updated_at),
    status:String(row.status),planId:row.plan_id as string|null,planName:(plan?.name as string|null)??null,
    lastAccessAt:row.last_access_at as string|null,createdAt:String(row.created_at),updatedAt:String(row.updated_at)};
};
export function createAdminRepository(client:SupabaseClient) {
  const count=async(table:string,filter?:{column:string;value:unknown})=>{
    let q=client.from(table).select("id",{count:"exact",head:true});
    if(filter) q=q.eq(filter.column,filter.value);
    const r=await q;if(r.error)throw r.error;return r.count??0;
  };
  const signAvatars=async(items:AdminClient[])=>{
    const paths=[...new Set(items.filter(x=>ownAvatarPath(x.avatarPath,x.userId)).map(x=>x.avatarPath!))];
    const r=paths.length?await client.storage.from("images").createSignedUrls(paths,900):null;
    const urls=new Map((r?.data??[]).map(x=>[x.path,x.signedUrl]));
    return items.map(x=>({...x,avatarUrl:urls.get(x.avatarPath??"")||null,avatarError:!!x.avatarPath&&!urls.get(x.avatarPath)}));
  };
  return {
    async createClient(input:{name:string;email:string;password:string;confirmed:boolean}) {
      const {data,error}=await client.functions.invoke("admin-create-client",{body:input});
      if(error) {
        if(error.context instanceof Response) {
          const result=await error.context.json().catch(()=>null);
          if(typeof result?.error==="string")throw new Error(result.error);
        }
        throw new Error("Não foi possível criar o cliente. Verifique a sessão e a conexão antes de tentar novamente.");
      }
      if(typeof data?.clientId!=="string")throw new Error("A criação não retornou uma ficha válida. Confira a listagem antes de repetir.");
      return data.clientId as string;
    },
    async getAdministrator(userId:string,email:string|undefined) {
      const {data,error}=await client.from("profiles").select("full_name,avatar_url").eq("id",userId).single();
      if(error)throw error;
      const name=data.full_name||email?.split("@")[0]||"Administrador";
      const signed=ownAvatarPath(data.avatar_url,userId)?await client.storage.from("images").createSignedUrl(data.avatar_url,900):null;
      return {name:String(name),avatarUrl:signed?.data?.signedUrl??null};
    },
    async getMetrics():Promise<AdminMetrics> {
      const [clients,activeClients,workouts,exercises,tips,nutritionPlans]=await Promise.all([
        count("clients"),count("clients",{column:"status",value:"active"}),count("workouts"),count("exercises"),count("tips"),count("nutrition_plans")]);
      return {clients,activeClients,workouts,exercises,tips,nutritionPlans};
    },
    async plans() {
      const {data,error}=await client.from("plans").select("id,name").order("name").limit(200);
      if(error)throw error;return (data??[]) as {id:string;name:string}[];
    },
    async listClients(f:ReturnType<typeof clientListFilters>) {
      const query=(head=false)=>{
      let q=client.from("clients").select(selectClient,{count:"exact",head}).order("created_at",{ascending:false}).order("id",{ascending:false});
      if(f.status!=="all")q=q.eq("status",f.status);
      if(f.planId)q=q.eq("plan_id",f.planId);
      if(f.fromDate)q=q.gte("created_at",f.fromDate);
      if(f.until)q=q.lt("created_at",f.until);
      if(f.search)q=q.or(`full_name.ilike.%${f.search}%,email.ilike.%${f.search}%`,{referencedTable:"profile"});
      return q;
      };
      const start=(f.page-1)*f.pageSize;
      const {rows,total}=await readAdminPage(()=>query().range(start,start+f.pageSize-1),()=>query(true),start);
      return {clients:await signAvatars((rows as Row[]).map(toClient)),total,page:f.page,pageSize:f.pageSize};
    },
    async getClient(id:string):Promise<AdminClientDetail|null> {
      const {data,error}=await client.from("clients").select(selectClient).eq("id",id).maybeSingle();
      if(error)throw error;if(!data)return null;
      const [subscriptions,weight,measurements,photos,performance,workout,nutrition,workoutCount,progressCount]=await Promise.all([
        client.from("subscriptions").select("id,status,started_at,expires_at").eq("client_id",id).order("created_at",{ascending:false}).order("id",{ascending:false}).limit(10),
        client.from("progress_weights").select("value,recorded_at").eq("client_id",id).order("recorded_at",{ascending:false}).order("created_at",{ascending:false}).limit(1),
        client.from("progress_measurements").select("recorded_at").eq("client_id",id).order("recorded_at",{ascending:false}).limit(1),
        client.from("progress_photos").select("recorded_at").eq("client_id",id).order("recorded_at",{ascending:false}).limit(1),
        client.from("performance_records").select("recorded_at").eq("client_id",id).order("recorded_at",{ascending:false}).limit(1),
        client.from("workouts").select("name").eq("client_id",id).eq("scope","CLIENT").eq("status","published").eq("is_active",true).order("updated_at",{ascending:false}).limit(1),
        client.from("nutrition_plans").select("name").eq("client_id",id).eq("scope","CLIENT").order("updated_at",{ascending:false}).limit(1),
        count("workouts",{column:"client_id",value:id}),count("progress_weights",{column:"client_id",value:id})]);
      for(const r of [subscriptions,weight,measurements,photos,performance,workout,nutrition])if(r.error)throw r.error;
      const [base]=await signAvatars([toClient(data as Row)]),latest=weight.data?.[0];
      const dates=[latest?.recorded_at,measurements.data?.[0]?.recorded_at,photos.data?.[0]?.recorded_at,performance.data?.[0]?.recorded_at].filter((x):x is string=>typeof x==="string").sort();
      return {...base,subscriptions:(subscriptions.data??[]).map(x=>({id:x.id,status:x.status,startedAt:x.started_at,expiresAt:x.expires_at})),workoutCount,progressCount,
        latestWeight:latest?{value:Number(latest.value),recordedAt:latest.recorded_at}:null,lastEvolutionAt:dates.at(-1)??null,
        currentWorkout:workout.data?.[0]?.name??null,currentNutritionPlan:nutrition.data?.[0]?.name??null};
    },
    async getClientTarget(id:string) {
      const {data,error}=await client.from("clients").select("id,user_id,status,profile:profiles!clients_profile_fkey!inner(updated_at)").eq("id",id).maybeSingle();
      if(error)throw error;if(!data)return null;
      // Explicit FK is many-to-one; the untyped Supabase client cannot infer that relationship.
      const target=data as unknown as Row,profile=target.profile as Row;
      return {id:String(target.id),userId:String(target.user_id),status:String(target.status),profileUpdatedAt:String(profile.updated_at)};
    },
    async updateProfile(userId:string,name:string,updatedAt:string) {
      const {data,error}=await client.from("profiles").update({full_name:name}).eq("id",userId).eq("updated_at",updatedAt).select("id").maybeSingle();
      if(error)throw error;if(!data)throw new Error("O perfil mudou em outra sessão. Recarregue a ficha antes de salvar.");
    },
    async updateStatus(id:string,status:string,previousStatus:string) {
      const {data,error}=await client.from("clients").update({status}).eq("id",id).eq("status",previousStatus).select("id").maybeSingle();
      if(error)throw error;if(!data)throw new Error("O status mudou em outra sessão. Recarregue a ficha.");
    },
  };
}
