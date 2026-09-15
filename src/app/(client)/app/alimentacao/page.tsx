import { PageHeader } from "@/components/ui";
import { FoodCard, Hero, TabNavigation } from "@/components/client/client-components";

const meals = [{ title: "Café da manhã", description: "Comece o dia com energia", icon: "☼" }, { title: "Almoço equilibrado", description: "Nutrição para seu ritmo", icon: "◒" }, { title: "Lanches", description: "Opções práticas e gostosas", icon: "♡" }, { title: "Jantar leve", description: "Cuide de você até o fim do dia", icon: "☾" }];
export default function FoodPage() { return <div><PageHeader title="Alimentação" /><Hero eyebrow="CUIDAR TAMBÉM É NUTRIR" title="Escolhas que fazem bem" description="Orientações simples para uma rotina mais leve." icon="◒" className="food-hero" /><TabNavigation tabs={["Meu dia", "Receitas", "Orientações"]} selected="Meu dia" /><div className="food-list">{meals.map((meal) => <FoodCard {...meal} key={meal.title} />)}</div></div>; }
