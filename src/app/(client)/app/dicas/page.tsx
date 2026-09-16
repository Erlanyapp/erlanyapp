import { EmptyState, PageHeader } from "@/components/ui";
import { Hero, TabNavigation, TipCard } from "@/components/client/client-components";
import { ContentError } from "@/components/client/content-states";
import { getContentService } from "@/services/server-content";
export default async function TipsPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { tab } = await searchParams;
  const service = await getContentService();
  if (!service) return <><PageHeader title="Dicas da Erlany" /><ContentError label="as dicas" /></>;
  try {
    const all = await service.listTips(); const tabs = ["Todos", ...new Set(all.map(tip => tip.categoryName || "Sem categoria"))];
    const selected = tab && tabs.includes(tab) ? tab : "Todos";
    const tips = all.filter(tip => selected === "Todos" || (tip.categoryName || "Sem categoria") === selected);
    return <div><PageHeader title="Dicas da Erlany" /><Hero title="Mais que treino, é um estilo de vida!" description="Inspiração para cuidar de você todos os dias." icon="✦" className="tip-hero" /><TabNavigation tabs={tabs} selected={selected} basePath="/app/dicas" /><div className="tip-list">{tips.length ? tips.map(tip => <TipCard tip={tip} key={tip.id} />) : <EmptyState title="Nenhuma dica disponível" description="Novos conteúdos aparecerão aqui quando forem liberados." />}</div></div>;
  } catch { return <><PageHeader title="Dicas da Erlany" /><ContentError label="as dicas" /></>; }
}
