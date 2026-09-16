import { PageHeader, EmptyState } from "@/components/ui";
import { getClientAccount } from "@/services/server-account";
import { ContactForm } from "@/components/client/account-forms";
import { ContentError } from "@/components/client/content-states";
export default async function ContactPage() {
  const { account, service } = await getClientAccount();
  let items; try { items = await service.messages(account.clientId); } catch { return <><PageHeader title="Falar com a Erlany" back backHref="/app/mais" /><ContentError label="suas mensagens" /></>; }
  return <div><PageHeader title="Falar com a Erlany" back backHref="/app/mais" /><p className="muted">Envie sua dúvida. Este é um canal de mensagens, não um chat em tempo real. Volte a esta página para consultar respostas.</p><ContactForm /><h2 className="subsection-title">Histórico</h2>{items.length ? <div className="content-list">{items.map(item => <article className="card account-panel" key={item.id}><strong>{item.sender_id === account.id ? "Você" : "Equipe Erlany"}</strong><p className="preserve-lines">{item.message}</p><small>{new Date(item.created_at).toLocaleString("pt-BR")}</small></article>)}</div> : <EmptyState title="Sem mensagens" description="As mensagens enviadas e suas respostas aparecerão aqui." />}</div>;
}
