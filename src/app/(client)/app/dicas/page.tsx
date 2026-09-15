import { PageHeader, Card } from "@/components/ui";
const tips = ["Motivação", "Saúde e bem-estar", "Cuidados com o corpo", "Recuperação muscular", "Vida equilibrada", "Perguntas frequentes"];
export default function TipsPage() { return <div><PageHeader title="Dicas da Erlany" /><Card className="tip-hero"><p>Mais que treino,<br />é um estilo<br />de vida!</p><span>✦</span></Card><div className="category-list tip-list">{tips.map((tip) => <Card className="category-row" key={tip}><span className="tip-icon">♡</span><strong>{tip}</strong><b>›</b></Card>)}</div></div>; }
