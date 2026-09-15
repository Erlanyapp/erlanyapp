import { PageHeader } from "@/components/ui";
import { Hero, TabNavigation, TipCard } from "@/components/client/client-components";
import { tips } from "@/data/client-mocks";
export default function TipsPage() { return <div><PageHeader title="Dicas da Erlany" /><Hero title="Mais que treino, é um estilo de vida!" description="Inspiração para cuidar de você todos os dias." icon="✦" className="tip-hero" /><TabNavigation tabs={["Todos", "Mente", "Bem-estar", "Autocuidado"]} selected="Todos" /><div className="tip-list">{tips.map((tip) => <TipCard tip={tip} key={tip.title} />)}</div></div>; }
