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
    const [plans, recipes] = await Promise.all([service.listNutritionPlans(), service.listRecipes()]);
    const sections = await Promise.all(plans.map(async plan => ({ plan, meals: await service.listNutritionMeals(plan.id) })));
    const guidance = sections.flatMap(({ plan, meals }) => meals.filter(meal => !!meal.guidance).map(meal => ({ ...meal, planName: plan.name })));
    return <div><PageHeader title="Alimentação" back /><Hero eyebrow="CUIDAR TAMBÉM É NUTRIR" title="Escolhas que fazem bem" description="Seu conteúdo alimentar liberado." icon="◒" className="food-hero" /><TabNavigation tabs={tabs} selected={selected} basePath="/app/alimentacao" /><div className="food-list">
      {selected === "Planos" && (sections.length ? sections.map(({ plan, meals }) => <details className="card action-details food-plan" key={plan.id} open><summary>{plan.name}</summary>{plan.objective ? <strong>{plan.objective}</strong> : null}{plan.description ? <p>{plan.description}</p> : null}{plan.notes ? <p className="preserve-lines muted">{plan.notes}</p> : null}{meals.length ? <div className="meal-list">{meals.map(meal => <article className="card meal-row" key={meal.id}><header><strong>{meal.name}</strong>{meal.mealTime ? <span>{meal.mealTime.slice(0, 5)}</span> : null}</header>{meal.description ? <p>{meal.description}</p> : null}{meal.items.length ? <ul className="meal-food-items">{meal.items.map(item => <li key={item.id}>{item.quantity ?? ""}{item.unit ? ` ${item.unit}` : ""} {item.foodName}{item.notes ? ` · ${item.notes}` : ""}</li>)}</ul> : null}{meal.guidance ? <p className="preserve-lines">{meal.guidance}</p> : null}{meal.recipeId && recipes.some(recipe => recipe.id === meal.recipeId) && <Link className="button button-outline" href={`/app/alimentacao/receitas/${meal.recipeId}`}>Ver receita</Link>}</article>)}</div> : <p className="muted">As refeições deste plano ainda não foram liberadas.</p>}</details>) : <EmptyState title="Nenhum plano disponível hoje" description="Seu plano aparecerá aqui quando estiver ativo e programado para você." />)}
      {selected === "Receitas" && (recipes.length ? recipes.map(recipe => <Link className="card account-panel" href={`/app/alimentacao/receitas/${recipe.id}`} key={recipe.id}><h2>{recipe.name}</h2><p>{recipe.description}</p><span className="muted">Ver ingredientes e preparo →</span></Link>) : <EmptyState title="Nenhuma receita disponível" description="Receitas liberadas aparecerão aqui." />)}
      {selected === "Orientações" && (guidance.length ? guidance.map(meal => <article className="card account-panel" key={meal.id}><small>{meal.planName}</small><h2>{meal.name}</h2><p className="preserve-lines">{meal.guidance}</p></article>) : <EmptyState title="Sem orientações liberadas" description="As orientações das suas refeições aparecerão aqui." />)}
    </div></div>;
  } catch { return <><PageHeader title="Alimentação" /><ContentError label="sua alimentação" /></>; }
}
