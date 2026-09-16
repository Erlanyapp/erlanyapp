import Link from "next/link";
import { EmptyState, PageHeader } from "@/components/ui";
import { getClientAccount } from "@/services/server-account";
import { ContentError } from "@/components/client/content-states";
export default async function PlanDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; const { service } = await getClientAccount();
  let plan; try { plan = (await service.plans()).find(item => item.id === id); } catch { return <><PageHeader title="Plano" back backHref="/app/planos" /><ContentError label="este plano" /></>; }
  return <div><PageHeader title={plan?.name ?? "Plano"} back backHref="/app/planos" />{plan ? <section className="card account-panel"><h2>{new Intl.NumberFormat("pt-BR", { style: "currency", currency: plan.currency }).format(plan.priceCents / 100)}</h2><p>{plan.description}</p><p>Assinatura online em breve. Nenhuma compra ou cobrança é realizada nesta página.</p><Link className="button button-primary full-width" href="/app/contato">Tirar dúvidas com a Erlany</Link></section> : <EmptyState title="Plano indisponível" description="Este plano não está disponível." />}</div>;
}
