import Image from "next/image";
import { PageHeader, EmptyState } from "@/components/ui";
import { ContentError } from "@/components/client/content-states";
import { getContentService } from "@/services/server-content";
export default async function RecipePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; const service = await getContentService();
  if (!service) return <><PageHeader title="Receita" back backHref="/app/alimentacao?tab=Receitas" /><ContentError label="esta receita" /></>;
  try { const recipe = (await service.listRecipes()).find(item => item.id === id);
    return <div><PageHeader title={recipe?.name ?? "Receita"} back backHref="/app/alimentacao?tab=Receitas" />{recipe ? <article className="card account-panel">{recipe.imageUrl ? <Image className="recipe-cover" src={recipe.imageUrl} alt="" width={720} height={360} unoptimized /> : null}<p>{recipe.description}</p><h2>Ingredientes</h2>{recipe.ingredients.length ? <ul>{recipe.ingredients.map((item,index) => <li key={index}>{item.name}{item.quantity ? ` · ${item.quantity}` : ""}{item.unit ? ` ${item.unit}` : ""}{item.notes ? ` · ${item.notes}` : ""}</li>)}</ul> : <p className="muted">Ingredientes ainda não informados.</p>}<h2>Preparo</h2><p className="preserve-lines">{recipe.instructions || "Modo de preparo ainda não informado."}</p></article> : <EmptyState title="Receita não encontrada" description="Esta receita não está disponível para o seu perfil." />}</div>;
  } catch { return <><PageHeader title="Receita" back backHref="/app/alimentacao?tab=Receitas" /><ContentError label="esta receita" /></>; }
}
