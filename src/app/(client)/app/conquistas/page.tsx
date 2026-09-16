import { PageHeader, EmptyState } from "@/components/ui";
import { getClientAccount } from "@/services/server-account";
import { ContentError } from "@/components/client/content-states";
export default async function AchievementsPage() {
  const { account, service } = await getClientAccount();
  let items; try { items = await service.achievements(account.clientId); } catch { return <><PageHeader title="Minhas conquistas" back backHref="/app/mais" /><ContentError label="suas conquistas" /></>; }
  return <div><PageHeader title="Minhas conquistas" back backHref="/app/mais" />{items.length ? <div className="content-list">{items.map(item => <article className="card account-panel" key={item.id}><h2>{item.achievement?.name ?? "Conquista liberada"}</h2><p>{item.achievement?.description}</p><small>{new Date(item.achieved_at).toLocaleDateString("pt-BR")}</small></article>)}</div> : <EmptyState title="Cada passo conta" description="Suas conquistas aparecerão aqui conforme forem liberadas." />}</div>;
}
