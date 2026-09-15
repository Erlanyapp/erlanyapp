import { PageHeader, EmptyState } from "@/components/ui";
import { CategoryCard, TabNavigation } from "@/components/client/client-components";
import { categories } from "@/data/client-mocks";
export default function WorkoutsPage() { return <div><PageHeader title="Treinos" /><TabNavigation tabs={["Categorias", "Meus treinos"]} selected="Categorias" /><div className="category-list">{categories.map((category) => <CategoryCard category={category} key={category.name} />)}</div><EmptyState title="Personalize seu ritmo" description="Em breve, seus treinos aparecerão aqui." /></div>; }
