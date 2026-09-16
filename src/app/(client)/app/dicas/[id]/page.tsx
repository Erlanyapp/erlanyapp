import { EmptyState, PageHeader } from "@/components/ui";
import { ContentError } from "@/components/client/content-states";
import { getContentService } from "@/services/server-content";
export default async function TipDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; const service = await getContentService();
  if (!service) return <><PageHeader title="Dica" back backHref="/app/dicas" /><ContentError label="esta dica" /></>;
  try { const tip = (await service.listTips()).find(item => item.id === id);
    return <div><PageHeader title={tip?.title ?? "Dica"} back backHref="/app/dicas" />{tip ? <article className="card account-panel"><small>{tip.categoryName}</small>{tip.summary && <p>{tip.summary}</p>}<p className="preserve-lines">{tip.content}</p></article> : <EmptyState title="Dica não encontrada" description="Este conteúdo não está disponível para o seu perfil." />}</div>;
  } catch { return <><PageHeader title="Dica" back backHref="/app/dicas" /><ContentError label="esta dica" /></>; }
}
