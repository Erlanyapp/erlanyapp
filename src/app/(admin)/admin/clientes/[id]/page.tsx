import Link from "next/link";
import { Card } from "@/components/ui";
import { requireAdmin } from "@/lib/supabase/admin";
import { createAdminService } from "@/services/admin-service";

const date = (value: string | null) => value ? new Date(value).toLocaleDateString("pt-BR") : "—";

export default async function AdminClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { client } = await requireAdmin();
  try {
    const item = await createAdminService(client).getClient(id);
    if (!item) return <div className="admin-state"><h2>Cliente não encontrado</h2><Link href="/admin/clientes">Voltar para clientes</Link></div>;
    return <div><Link className="admin-back" href="/admin/clientes">‹ Voltar para clientes</Link><div className="admin-page-intro"><p className="admin-overline">PERFIL DO CLIENTE</p><h2>{item.fullName || "Cliente sem nome"}</h2><p>ID do cliente: {item.id}</p></div><div className="admin-detail-grid"><Card><p className="admin-overline">DADOS BÁSICOS</p><dl className="admin-data-list"><div><dt>Status</dt><dd><span className={`admin-status ${item.status}`}>{item.status}</span></dd></div><div><dt>Usuário</dt><dd>{item.userId}</dd></div><div><dt>Plano</dt><dd>{item.planId ?? "Não definido"}</dd></div><div><dt>Cadastro</dt><dd>{date(item.createdAt)}</dd></div><div><dt>Último acesso</dt><dd>{date(item.lastAccessAt)}</dd></div></dl></Card><Card><p className="admin-overline">RELACIONAMENTOS</p><div className="admin-related-grid"><strong>{item.workoutCount}<small>treinos do cliente</small></strong><strong>{item.progressCount}<small>registros de evolução</small></strong></div>{item.subscriptions.length ? <div className="admin-subscriptions">{item.subscriptions.map((subscription) => <p key={subscription.id}><b>{subscription.status}</b><span>{date(subscription.startedAt)} — {date(subscription.expiresAt)}</span></p>)}</div> : <p className="muted">Nenhuma assinatura registrada.</p>}</Card></div><Card className="admin-note"><p className="admin-overline">SOMENTE LEITURA</p><p>Conteúdo, pagamentos e dados sensíveis não são editados nesta fase.</p></Card></div>;
  } catch { return <div className="admin-state"><h2>Não foi possível carregar o cliente</h2><p>Tente novamente em instantes.</p></div>; }
}
