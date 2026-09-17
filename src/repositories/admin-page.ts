type PageResult<T> = { data:T[]|null; error:{code?:string}|null; count:number|null };

// PostgREST returns 416 for an offset beyond the last row and drops its count.
// Recount with the identical filters; never turn another database error into empty UI.
export async function readAdminPage<T>(page:()=>PromiseLike<PageResult<T>>,count:()=>PromiseLike<PageResult<T>>,offset:number) {
  const result=await page();
  if(result.error?.code==="PGRST103"&&offset>0) {
    const total=await count();
    if(total.error)throw total.error;
    if(total.count!==null&&offset>=total.count)return {rows:[] as T[],total:total.count};
  }
  if(result.error)throw result.error;
  return {rows:result.data??[],total:result.count??0};
}
