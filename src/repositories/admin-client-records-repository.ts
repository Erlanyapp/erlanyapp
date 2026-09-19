import type { SupabaseClient } from "@supabase/supabase-js";
import type { ClientTab } from "@/domain/admin-client";
import type { AdminClientRecord, AdminClientRecordGroup, AdminClientRecords } from "@/types/admin";
import { readAdminPage } from "./admin-page";
type Row=Record<string,unknown>;
const text=(value:unknown)=>typeof value==="string"?value:null;
const number=(value:unknown)=>value===null||value===undefined?null:new Intl.NumberFormat("pt-BR",{maximumFractionDigits:2}).format(Number(value));
const fields=(values:Array<[string,string|null]>)=>values.filter((x):x is [string,string]=>x[1]!==null).map(([label,value])=>({label,value}));
const eventTitle=(action:string)=>({profile_updated:"Perfil atualizado",client_status_changed:"Status do cadastro alterado",client_created:"Cliente criado pelo Admin"}[action]??action);
const object=(value:unknown):Row=>value&&typeof value==="object"&&!Array.isArray(value)?value as Row:{};
const rows=(value:unknown):Row[]=>Array.isArray(value)?value as Row[]:[];
const saoPauloWeekStart=()=>{const parts=new Intl.DateTimeFormat("en-US",{timeZone:"America/Sao_Paulo",year:"numeric",month:"2-digit",day:"2-digit"}).formatToParts(new Date());const part=(type:Intl.DateTimeFormatPartTypes)=>parts.find(item=>item.type===type)?.value;const today=`${part("year")}-${part("month")}-${part("day")}`;const date=new Date(`${today}T12:00:00Z`);date.setUTCDate(date.getUTCDate()-((date.getUTCDay()+6)%7));return date.toISOString().slice(0,10);};

export function createAdminClientRecordsRepository(client:SupabaseClient) {
  const pageSize=20;
  async function read(table:string,columns:string,id:string,page:number,order:string,scope=false,history=false,dateFrom?:string) {
    const query=(head=false)=>{
      let q=client.from(table).select(columns,{count:"exact",head});
      if(history) q=q.eq("entity","clients").eq("entity_id",id);
      else q=q.eq("client_id",id);
      if(scope) q=q.eq("scope","CLIENT");
      if(dateFrom) q=q.gte("completed_date",dateFrom);
      return q.order(order,{ascending:false}).order("id",{ascending:false});
    };
    const start=(page-1)*pageSize;
    try {
      const result=await readAdminPage(()=>query().range(start,start+pageSize-1),()=>query(true),start);
      // Dynamic projections use the schema reviewed in migrations, without generated DB types.
      return {rows:result.rows as unknown as Row[],total:result.total};
    } catch(error) {
      throw new Error("Não foi possível consultar os registros desta seção. Tente novamente.",{cause:error});
    }
  }
  async function sign(row:Row):Promise<{imageUrl:string|null;imageError:boolean}> {
    if(row.bucket!=="images"||!text(row.path)) return {imageUrl:null,imageError:true};
    const {data,error}=await client.storage.from("images").createSignedUrl(String(row.path),900);
    return {imageUrl:data?.signedUrl??null,imageError:!!error||!data?.signedUrl};
  }
  const group=(title:string,empty:string,result:{rows:Row[];total:number},map:(x:Row)=>AdminClientRecord):AdminClientRecordGroup=>({title,empty,total:result.total,records:result.rows.map(map)});
  const base=(row:Row,title:string):AdminClientRecord=>({id:String(row.id),title,description:text(row.description),date:text(row.recorded_at)??text(row.created_at),fields:[]});
  return {
    async getRecords(id:string,tab:ClientTab,page:number):Promise<AdminClientRecords> {
      let groups:AdminClientRecordGroup[]=[];
      if(tab==="treinos") {
        const result=await read("workout_assignments","id,starts_on,ends_on,is_active,created_at,updated_at,workout:workouts(id,name,description,status,is_active,level,duration_minutes),schedule:workout_assignment_schedule(id,weekday,schedule_kind)",id,page,"updated_at");
        groups=[group("Treinos atribuídos","Nenhum treino atribuído.",result,row=>{const workout=object(row.workout),schedule=rows(row.schedule);return {...base(row,text(workout.name)??"Treino atribuído"),description:text(workout.description),fields:fields([
          ["Publicação",workout.status==="published"?"Publicado":workout.status==="draft"?"Rascunho":text(workout.status)],
          ["Disponibilidade",workout.is_active?"Ativo":"Inativo"],["Situação da atribuição",row.is_active?"Ativa":"Inativa"],
          ["Início",text(row.starts_on)],["Fim",text(row.ends_on)??"Sem fim"],["Dias configurados",String(schedule.length)],
          ["Nível",text(workout.level)],["Duração",workout.duration_minutes===null?null:`${number(workout.duration_minutes)} min`],
        ])}})];
      } else if(tab==="alimentacao") {
        const result=await read("nutrition_plans","id,name,description,created_at,updated_at",id,page,"updated_at",true);
        groups=[group("Planos alimentares individuais","Nenhum plano alimentar atribuído.",result,row=>base(row,String(row.name)))];
      } else if(tab==="evolucao") {
        const [weights,measurements,performance,photos,workoutCheckins,weekWorkoutCheckins]=await Promise.all([
          read("progress_weights","id,value,recorded_at,created_at",id,page,"recorded_at"),
          read("progress_measurements","id,measurements,recorded_at,created_at",id,page,"recorded_at"),
          read("performance_records","id,metric,value,unit,recorded_at,created_at",id,page,"recorded_at"),
          read("progress_photos","id,category,recorded_at,created_at",id,page,"recorded_at"),
          read("workout_checkins","id,completed_date,completed_at,created_at,workout:workouts(name)",id,page,"completed_at"),
          read("workout_checkins","id",id,1,"completed_at",false,false,saoPauloWeekStart()),
        ]);
        groups=[
          group("Peso","Nenhum peso registrado.",weights,row=>({...base(row,`${number(row.value)} kg`),fields:[]})),
          group("Medidas","Nenhuma medida registrada.",measurements,row=>({...base(row,"Registro de medidas"),fields:Object.entries((row.measurements??{}) as Row).filter(([,value])=>typeof value==="string"||typeof value==="number").map(([label,value])=>({label,value:String(value)}))})),
          group("Desempenho","Nenhum desempenho registrado.",performance,row=>({...base(row,String(row.metric)),fields:fields([["Valor",row.value===null?null:`${number(row.value)}${text(row.unit)?" "+row.unit:""}`]])})),
          {title:"Treinos concluídos",empty:"Nenhum treino concluído.",total:workoutCheckins.total,records:[{id:"workout-checkin-summary",title:"Resumo de treinos",description:null,date:null,fields:fields([["Total",String(workoutCheckins.total)],["Nesta semana",String(weekWorkoutCheckins.total)],["Último",workoutCheckins.rows[0]?text(object(workoutCheckins.rows[0].workout).name)??"Treino concluído":null]])},...workoutCheckins.rows.map(row=>{const workout=object(row.workout);return {...base(row,text(workout.name)??"Treino concluído"),date:text(row.completed_at)??text(row.completed_date),fields:fields([["Data",text(row.completed_date)]])};})]},
          group("Registros de fotos","Nenhum registro de foto de evolução.",photos,row=>({...base(row,text(row.category)??"Foto de evolução"),description:"Consulte os arquivos associados na aba Mídia."})),
        ];
      } else if(tab==="midia") {
        const [assets,videos]=await Promise.all([
          read("media_assets","id,title,alt_text,asset_type,bucket,path,created_at",id,page,"created_at",true),
          read("videos","id,title,provider,type,is_active,created_at",id,page,"created_at",true),
        ]);
        const records=await Promise.all(assets.rows.map(async row=>({...base(row,text(row.title)??text(row.alt_text)??"Arquivo associado"),
          fields:fields([["Tipo",text(row.asset_type)]]),...await sign(row)})));
        groups=[{title:"Arquivos privados associados",empty:"Nenhuma mídia associada ao cliente.",total:assets.total,records},
          group("Vídeos associados","Nenhum vídeo associado ao cliente.",videos,row=>({...base(row,String(row.title)),fields:fields([["Provedor",text(row.provider)],["Tipo",text(row.type)],["Disponibilidade",row.is_active?"Ativo":"Inativo"]])}))];
      } else if(tab==="historico") {
        const result=await read("audit_logs","id,action,created_at",id,page,"created_at",false,true);
        groups=[group("Histórico administrativo","Nenhum evento administrativo registrado. Eventos anteriores à auditoria não são reconstruídos.",result,row=>base(row,eventTitle(String(row.action))))];
      }
      return {groups,page,pageSize};
    },
  };
}
