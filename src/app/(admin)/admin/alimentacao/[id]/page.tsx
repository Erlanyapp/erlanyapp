import Link from "next/link";
import { notFound } from "next/navigation";
import { NutritionPlanEditor } from "@/components/admin/nutrition-plan-editor";
import { NutritionWorkspace } from "@/components/admin/nutrition-workspace";
import { requireAdmin } from "@/lib/supabase/admin";
import { createAdminNutritionService } from "@/services/admin-nutrition-service";

export default async function NutritionPlanPage({ params }: { params: Promise<{ id: string }> }) { const { id } = await params; const service = createAdminNutritionService((await requireAdmin()).client); const clients = await service.clients(); if (id === "novo") return <NutritionPlanEditor clients={clients} />; const [item, recipes] = await Promise.all([service.get(id), service.recipes()]); if (!item) notFound(); const meals = Array.isArray(item.nutrition_meals) ? item.nutrition_meals as never[] : []; const assignments = Array.isArray(item.nutrition_assignments) ? item.nutrition_assignments as never[] : []; return <div><Link className="admin-back" href="/admin/alimentacao">Voltar para planos alimentares</Link><NutritionPlanEditor clients={clients} item={item} /><NutritionWorkspace planId={id} meals={meals} assignments={assignments} clients={clients} recipes={recipes as never[]} /></div>; }
