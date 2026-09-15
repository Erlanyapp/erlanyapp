import Link from "next/link";
import { Card } from "@/components/ui";
import { requireAdmin } from "@/lib/supabase/admin";
import { createAdminService } from "@/services/admin-service";

const date = (value: string | null) => value ? new Date(value).toLocaleDateString("pt-BR") : "—";

export default async function AdminClientsPage({ searchParams }: { searchParams: Promise<{ q?: string; status?: string; page?: string }> }) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);
  const { client } = await requireAdmin();
  try {
    const result = await createAdminService(client).listClients({ search: params.q?.trim(), status: params.status, page, pageSize: 20 });
    const hasNext = result.total > page * result.pageSize;
    return <div><div className="admin-page-intro"><p className="admin-overline">GESTÃO</p><h2>Clientes</h2><p>Visualização segura dos clientes cadastrados.</p></div><form className="admin-filters"><input name="q" defaultValue={params.q} placeholder="Buscar por nome, status ou ID" aria-label="Buscar clientes" /><select name="status" defaultValue={params.status ?? "all"} aria-label="Filtrar por status"><option value="all">Todos os status</option><option value="active">Ativos</option><option value="inactive">Inativos</option></select><button className="button button-primary" type="submit">Filtrar</button></form><Card className="admin-table-card">{result.clients.length ? <div className="admin-table-wrap"><table><thead><tr><th>Cliente</th><th>Status</th><th>Plano</th><th>Cadastro</th><th>Último acesso</th><th /></tr></thead><tbody>{result.clients.map((item) => <tr key={item.id}><td><strong>{item.fullName || "Sem nome"}</strong><small>{item.userId}</small></td><td><span className={`admin-status ${item.status}`}>{item.status}</span></td><td>{item.planId ?? "—"}</td><td>{date(item.createdAt)}</td><td>{date(item.lastAccessAt)}</td><td><Link href={`/admin/clientes/${item.id}`}>Ver detalhes</Link></td></tr>)}</tbody></table></div> : <div className="admin-state"><h3>Nenhum cliente encontrado</h3><p>Ajuste os filtros ou aguarde novos cadastros.</p></div>}</Card><div className="admin-pagination"><span>{result.total} registro{result.total === 1 ? "" : "s"}</span>{page > 1 && <Link href={`/admin/clientes?q=${encodeURIComponent(params.q ?? "")}&status=${params.status ?? "all"}&page=${page - 1}`}>Anterior</Link>}{hasNext && <Link href={`/admin/clientes?q=${encodeURIComponent(params.q ?? "")}&status=${params.status ?? "all"}&page=${page + 1}`}>Próxima</Link>}</div></div>;
  } catch { return <div className="admin-state"><h2>Não foi possível carregar os clientes</h2><p>Tente novamente em instantes.</p></div>; }
}
