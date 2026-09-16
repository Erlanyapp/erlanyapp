import { PageHeader, EmptyState } from "@/components/ui";
import { getClientAccount } from "@/services/server-account";
import { ContentError } from "@/components/client/content-states";
export default async function NotificationsPage() {
  const { account, service } = await getClientAccount();
  let items; try { items = await service.notifications(account.clientId); } catch { return <><PageHeader title="Notificações" back backHref="/app/mais" /><ContentError label="suas notificações" /></>; }
  return <div><PageHeader title="Notificações" back backHref="/app/mais" />{items.length ? <div className="content-list">{items.map(item => <article className="card account-panel" key={item.id}><h2>{item.title}</h2><p>{item.body}</p><small>{new Date(item.created_at).toLocaleDateString("pt-BR")}</small></article>)}</div> : <EmptyState title="Tudo em dia" description="Suas notificações aparecerão aqui quando houver novidades." />}</div>;
}
