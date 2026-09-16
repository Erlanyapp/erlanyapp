import Link from "next/link";
import { EmptyState, PageHeader } from "@/components/ui";
import { Hero, TabNavigation } from "@/components/client/client-components";
import { ContentError } from "@/components/client/content-states";
import { getContentService } from "@/services/server-content";
export default async function FoodPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { tab } = await searchParams; const tabs = ["Planos","Receitas","Orientações"]; const selected = tab && tabs.includes(tab) ? tab : "Planos";
  const service = await getContentService();
  if (!service) return <><PageHeader title="Alimentação" /><ContentError label="sua alimentação" /></>;
  try {
    const plans = await service.listNutritionPlans();
    const [sections, recipes] = await Promise.all([Promise.all(plans.map(async plan => ({ plan, meals: await service.listNutritionMeals(plan.id) }))), service.listRecipes()]);
    const guidance = sections.flatMap(({ plan, meals }) => meals.filter(meal => !!meal.guidance).map(meal => ({ ...meal, planName: plan.name })));
    return <div><PageHeader title="Alimentação" back /><Hero eyebrow="CUIDAR TAMBÉM É NUTRIR" title="Escolhas que fazem bem" description="Seu conteúdo alimentar liberado." icon="◒" className="food-hero" /><TabNavigation tabs={tabs} selected={selected} basePath="/app/alimentacao" /><div className="food-list">
      {selected === "Planos" && (sections.length ? sections.map(({ plan, meals }) => <details className="card action-details food-plan" key={plan.id}><summary>{plan.name}</summary><p>{plan.description}</p>{meals.length ? <div className="meal-list">{meals.map(meal => <article className="card meal-row" key={meal.id}><strong>{meal.name}</strong><p className="preserve-lines">{meal.guidance}</p>{meal.recipeId && recipes.some(recipe => recipe.id === meal.recipeId) && <Link className="button button-outline" href={`/app/alimentacao/receitas/${meal.recipeId}`}>Ver receita</Link>}</article>)}</div> : <p className="muted">As refeições deste plano ainda não foram liberadas.</p>}</details>) : <EmptyState title="Nenhum plano disponível" description="Seu plano alimentar aparecerá aqui quando for liberado." />)}
      {selected === "Receitas" && (recipes.length ? recipes.map(recipe => <Link className="card account-panel" href={`/app/alimentacao/receitas/${recipe.id}`} key={recipe.id}><h2>{recipe.name}</h2><p>{recipe.description}</p><span className="muted">Ver ingredientes e preparo →</span></Link>) : <EmptyState title="Nenhuma receita disponível" description="Receitas liberadas aparecerão aqui." />)}
      {selected === "Orientações" && (guidance.length ? guidance.map(meal => <article className="card account-panel" key={meal.id}><small>{meal.planName}</small><h2>{meal.name}</h2><p className="preserve-lines">{meal.guidance}</p></article>) : <EmptyState title="Sem orientações liberadas" description="As orientações das suas refeições aparecerão aqui." />)}
    </div></div>;
  } catch { return <><PageHeader title="Alimentação" /><ContentError label="sua alimentação" /></>; }
}
