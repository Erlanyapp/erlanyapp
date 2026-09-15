import { EmptyState, PageHeader } from "@/components/ui";
import { FoodCard, Hero, TabNavigation } from "@/components/client/client-components";
import { ContentError } from "@/components/client/content-states";
import { getContentService } from "@/services/server-content";
export default async function FoodPage() {
  const service = await getContentService();
  if (!service) return <div><PageHeader title="Alimentação" /><ContentError label="sua alimentação" /></div>;
  try {
    const plans = await service.listNutritionPlans();
    const sections = await Promise.all(plans.map(async (plan) => ({ plan, meals: await service.listNutritionMeals(plan.id) })));
    return <div><PageHeader title="Alimentação" /><Hero eyebrow="CUIDAR TAMBÉM É NUTRIR" title="Escolhas que fazem bem" description="Orientações simples para uma rotina mais leve." icon="◒" className="food-hero" /><TabNavigation tabs={["Planos", "Receitas", "Orientações"]} selected="Planos" /><div className="food-list">{sections.length ? sections.map(({ plan, meals }) => <section className="food-plan" key={plan.id}><FoodCard title={plan.name} description={plan.description ?? "Plano alimentar disponível para você."} icon="◒" />{meals.length ? <div className="meal-list">{meals.map((meal) => <div className="card meal-row" key={meal.id}><div><strong>{meal.mealOrder}. {meal.name}</strong>{meal.guidance && <p>{meal.guidance}</p>}</div></div>)}</div> : <p className="muted food-empty-note">As refeições deste plano ainda não foram liberadas.</p>}</section>) : <EmptyState title="Nenhum plano disponível" description="Seu conteúdo de alimentação aparecerá aqui quando for liberado." />}</div></div>;
  } catch { return <div><PageHeader title="Alimentação" /><ContentError label="sua alimentação" /></div>; }
}
