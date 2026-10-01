import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/supabase/admin";
import { createAdminMediaService } from "@/services/admin-media-service";
import { MediaEditor } from "@/components/admin/media-editor";
export default async function MediaDetail({params}:{params:Promise<{id:string}>}){const{id}=await params;const service=createAdminMediaService((await requireAdmin()).client);const[clients,item]=await Promise.all([service.clients(),id==="novo"?Promise.resolve(null):service.get(id)]);if(id!=="novo"&&!item)notFound();return <div><Link className="admin-back" href="/admin/midia">Voltar para mídia</Link><MediaEditor item={item??undefined} clients={clients}/></div>}
