import { notFound } from "next/navigation";
import Link from "next/link";
import { RecipeEditor } from "@/components/admin/recipe-editor";
import { requireAdmin } from "@/lib/supabase/admin";
import { createAdminEditorialService } from "@/services/admin-editorial-service";

export default async function RecipePage({ params }: { params: Promise<{ id: string }> }) { const id = (await params).id; const service = createAdminEditorialService((await requireAdmin()).client); const [clients, item] = await Promise.all([service.clients(), id === "novo" ? Promise.resolve(null) : service.getRecipe(id)]); if (id !== "novo" && !item) notFound(); return <div><Link className="admin-back" href="/admin/alimentacao/receitas">Voltar para receitas</Link><RecipeEditor item={item ?? undefined} clients={clients} /></div>; }
