import { validateName } from "./client-account";
export { clientRegistration } from "../../supabase/functions/_shared/client-registration";
export const ADMIN_PAGE_SIZE = 20;
export const clientTabs = ["visao-geral","perfil","treinos","alimentacao","evolucao","midia","historico"] as const;
export type ClientTab = typeof clientTabs[number];
export type AdminSearchParams = Record<string,string|string[]|undefined>;
export function recordPage(value: unknown) {
  const page=typeof value==="string"?Number(value):1;
  if(!Number.isSafeInteger(page)||page<1||page>100000)throw new Error("Página de registros inválida.");
  return page;
}
export function adminClientId(value:unknown):string {
  if(typeof value !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)) throw new Error("Cliente inválido.");
  return value;
}
function dateFilter(value:unknown) {
  if(!value) return undefined;
  if(typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value) || !Number.isFinite(Date.parse(value)) || new Date(value).toISOString().slice(0,10)!==value) throw new Error("Período de cadastro inválido.");
  return value;
}
// Match the calendar dates shown in the Admin (Brazil), including historical DST.
const registrationCalendar=new Intl.DateTimeFormat("en-CA",{timeZone:"America/Sao_Paulo",year:"numeric",month:"2-digit",day:"2-digit"});
function registrationDayStart(value:string) {
  const calendarDate=(instant:number)=>{
    const parts=registrationCalendar.formatToParts(new Date(instant));
    const part=(type:string)=>parts.find(x=>x.type===type)!.value;
    return `${part("year").padStart(4,"0")}-${part("month")}-${part("day")}`;
  };
  const utc=Date.parse(value+"T00:00:00Z");
  let before=utc-86400000,after=utc+86400000;
  while(after-before>1) {
    const middle=Math.floor((before+after)/2);
    if(calendarDate(middle)<value)before=middle;else after=middle;
  }
  return new Date(after).toISOString();
}
export function clientListFilters(params:AdminSearchParams) {
  const raw=typeof params.page === "string"?Number(params.page):1;
  if(Number.isSafeInteger(raw)&&raw>100000)throw new Error("Página fora do intervalo permitido.");
  const page=Number.isSafeInteger(raw)&&raw>0?raw:1;
  const status=params.status === "active"||params.status === "inactive"?params.status:"all";
  const search=typeof params.q === "string"?params.q.trim().replace(/[,%_()*"\\]/g," ").replace(/\s+/g," ").slice(0,100):"";
  const planId=params.plan&&params.plan!=="all"?adminClientId(params.plan):undefined;
  const fromDate=dateFilter(params.from),toDate=dateFilter(params.to);
  if(fromDate&&toDate&&fromDate>toDate) throw new Error("A data inicial deve preceder a final.");
  const followingDay=toDate?new Date(Date.parse(toDate)+86400000).toISOString().slice(0,10):undefined;
  const until=followingDay?registrationDayStart(followingDay):undefined;
  return {page,pageSize:ADMIN_PAGE_SIZE,status,search,planId,fromDate:fromDate?registrationDayStart(fromDate):undefined,toDate,until};
}
export function profileEdit(form:FormData) { return {name:validateName(form.get("name")),updatedAt:typeof form.get("updatedAt")==="string"?String(form.get("updatedAt")):""}; }
export function clientTab(value:unknown):ClientTab { return clientTabs.includes(value as ClientTab)?value as ClientTab:"visao-geral"; }
export function nextClientStatus(value:unknown):"active"|"inactive" {
  if(value!=="active"&&value!=="inactive") throw new Error("Status inválido.");
  return value==="active"?"inactive":"active";
}
