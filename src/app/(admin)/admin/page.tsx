import Link from "next/link";
import { Card } from "@/components/ui";
import { requireAdmin } from "@/lib/supabase/admin";
import { createAdminService } from "@/services/admin-service";

const metrics = [
  ["clients", "Clientes", "/admin/clientes"], ["activeClients", "Clientes ativos", "/admin/clientes"], ["workouts", "Treinos", "/app/treinos"], ["exercises", "Exercícios", "/app/treinos"], ["tips", "Dicas", "/app/dicas"], ["nutritionPlans", "Planos alimentares", "/app/alimentacao"],
] as const;

export default async function AdminDashboardPage() {
  const { client } = await requireAdmin();
  const service = createAdminService(client);
  try {
    const values = await service.getMetrics();
    return <div><div className="admin-page-intro"><p className="admin-overline">VISÃO GERAL</p><h2>Dashboard</h2><p>Acompanhe os principais dados do ERLANY FIT.</p></div><div className="admin-metric-grid">{metrics.map(([key, label, href]) => <Link href={href} key={key}><Card className="admin-metric-card"><strong>{values[key]}</strong><span>{label}</span></Card></Link>)}</div><Card className="admin-note"><p className="admin-overline">PRÓXIMAS ETAPAS</p><h3>Base administrativa pronta</h3><p>O gerenciamento de conteúdo será habilitado nas próximas fases. Nesta etapa, a visualização permanece somente leitura.</p></Card></div>;
  } catch { return <div className="admin-state"><h2>Não foi possível carregar o dashboard</h2><p>Verifique sua conexão e tente novamente.</p></div>; }
}
