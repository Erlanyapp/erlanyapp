import { notFound } from "next/navigation";
import Link from "next/link";
import { TipEditor } from "@/components/admin/tip-editor";
import { requireAdmin } from "@/lib/supabase/admin";
import { createAdminEditorialService } from "@/services/admin-editorial-service";

export default async function TipPage({ params }: { params: Promise<{ id: string }> }) { const id = (await params).id; const service = createAdminEditorialService((await requireAdmin()).client); const [clients, categories, item] = await Promise.all([service.clients(), service.tipCategories(), id === "novo" ? Promise.resolve(null) : service.getTip(id)]); if (id !== "novo" && !item) notFound(); return <div><Link className="admin-back" href="/admin/dicas">Voltar para dicas</Link><TipEditor item={item ?? undefined} clients={clients} categories={categories} /></div>; }
