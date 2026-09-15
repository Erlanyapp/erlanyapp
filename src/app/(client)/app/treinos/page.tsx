import { PageHeader, Card, EmptyState } from "@/components/ui";

const categories = ["Glúteos", "Pernas", "Costas", "Braços", "Abdômen", "Cardio", "Alongamento"];
export default function WorkoutsPage() { return <div><PageHeader title="Treinos" /><div className="segmented"><span className="selected">Categorias</span><span>Meus treinos</span></div><div className="category-list">{categories.map((category, index) => <Card className="category-row" key={category}><span className={`category-art category-art-${index}`} aria-hidden="true">✦</span><span><strong>{category}</strong><small>{index % 2 ? "Força e definição" : "Treinos completos"}</small></span><b>›</b></Card>)}</div><EmptyState title="Personalize seu ritmo" description="Em breve, seus treinos aparecerão aqui." /></div>; }
