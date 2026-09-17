import type { SupabaseClient } from "@supabase/supabase-js";
import type { ClientTab } from "@/domain/admin-client";
import type { AdminClientRecord, AdminClientRecordGroup, AdminClientRecords } from "@/types/admin";
import { readAdminPage } from "./admin-page";
type Row=Record<string,unknown>;
const text=(value:unknown)=>typeof value==="string"?value:null;
const number=(value:unknown)=>value===null||value===undefined?null:new Intl.NumberFormat("pt-BR",{maximumFractionDigits:2}).format(Number(value));
const fields=(values:Array<[string,string|null]>)=>values.filter((x):x is [string,string]=>x[1]!==null).map(([label,value])=>({label,value}));
const eventTitle=(action:string)=>({profile_updated:"Perfil atualizado",client_status_changed:"Status do cadastro alterado",client_created:"Cliente criado pelo Admin"}[action]??action);

export function createAdminClientRecordsRepository(client:SupabaseClient) {
  const pageSize=20;
  async function read(table:string,columns:string,id:string,page:number,order:string,scope=false,history=false) {
    const query=(head=false)=>{
      let q=client.from(table).select(columns,{count:"exact",head});
      if(history) q=q.eq("entity","clients").eq("entity_id",id);
      else q=q.eq("client_id",id);
      if(scope) q=q.eq("scope","CLIENT");
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
        const result=await read("workouts","id,name,description,status,is_active,level,duration_minutes,created_at,updated_at",id,page,"updated_at",true);
        groups=[group("Treinos individuais","Nenhum treino atribuído.",result,row=>({...base(row,String(row.name)),fields:fields([
          ["Publicação",row.status==="published"?"Publicado":row.status==="draft"?"Rascunho":text(row.status)],
          ["Disponibilidade",row.is_active?"Ativo":"Inativo"],["Nível",text(row.level)],
          ["Duração",row.duration_minutes===null?null:`${number(row.duration_minutes)} min`],
        ])}))];
      } else if(tab==="alimentacao") {
        const result=await read("nutrition_plans","id,name,description,created_at,updated_at",id,page,"updated_at",true);
        groups=[group("Planos alimentares individuais","Nenhum plano alimentar atribuído.",result,row=>base(row,String(row.name)))];
      } else if(tab==="evolucao") {
        const [weights,measurements,performance,photos]=await Promise.all([
          read("progress_weights","id,value,recorded_at,created_at",id,page,"recorded_at"),
          read("progress_measurements","id,measurements,recorded_at,created_at",id,page,"recorded_at"),
          read("performance_records","id,metric,value,unit,recorded_at,created_at",id,page,"recorded_at"),
          read("progress_photos","id,category,recorded_at,created_at",id,page,"recorded_at"),
        ]);
        groups=[
          group("Peso","Nenhum peso registrado.",weights,row=>({...base(row,`${number(row.value)} kg`),fields:[]})),
          group("Medidas","Nenhuma medida registrada.",measurements,row=>({...base(row,"Registro de medidas"),fields:Object.entries((row.measurements??{}) as Row).filter(([,value])=>typeof value==="string"||typeof value==="number").map(([label,value])=>({label,value:String(value)}))})),
          group("Desempenho","Nenhum desempenho registrado.",performance,row=>({...base(row,String(row.metric)),fields:fields([["Valor",row.value===null?null:`${number(row.value)}${text(row.unit)?" "+row.unit:""}`]])})),
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
