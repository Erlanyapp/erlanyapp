import { requireAdmin } from "@/lib/supabase/admin";
import { createAdminMediaService } from "@/services/admin-media-service";
import { MediaLibrary } from "@/components/admin/media-library";
import type { MediaFilters } from "@/domain/admin-media";
export default async function MediaPage({searchParams}:{searchParams:Promise<MediaFilters>}){const params=await searchParams;try{const service=createAdminMediaService((await requireAdmin()).client);const[data,clients]=await Promise.all([service.list(params),service.clients()]);return <MediaLibrary data={data} filters={params} clients={clients}/>;}catch{return <div className="admin-state"><h2>Não foi possível carregar a biblioteca</h2><p>Verifique a conexão e tente novamente.</p></div>;}}
