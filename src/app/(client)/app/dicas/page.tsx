import { EmptyState, PageHeader } from "@/components/ui";
import { Hero, TabNavigation, TipCard } from "@/components/client/client-components";
import { ContentError } from "@/components/client/content-states";
import { getContentService } from "@/services/server-content";

export default async function TipsPage() {
  const service = await getContentService();
  if (!service) return <div><PageHeader title="Dicas da Erlany" /><ContentError label="as dicas" /></div>;
  try {
    const tips = await service.listTips();
    return <div><PageHeader title="Dicas da Erlany" /><Hero title="Mais que treino, é um estilo de vida!" description="Inspiração para cuidar de você todos os dias." icon="✦" className="tip-hero" /><TabNavigation tabs={["Todos", "Mente", "Bem-estar", "Autocuidado"]} selected="Todos" /><div className="tip-list">{tips.length ? tips.map((tip) => <TipCard tip={tip} key={tip.id} />) : <EmptyState title="Nenhuma dica disponível" description="Novos conteúdos aparecerão aqui em breve." />}</div></div>;
  } catch { return <div><PageHeader title="Dicas da Erlany" /><ContentError label="as dicas" /></div>; }
}
