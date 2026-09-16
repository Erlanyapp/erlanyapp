import { PageHeader, EmptyState } from "@/components/ui";
import { PlanCard } from "@/components/client/client-components";
import { getClientAccount } from "@/services/server-account";
import { ContentError } from "@/components/client/content-states";
import { AppIcon } from "@/components/icons";
export default async function PlansPage() {
  const { service } = await getClientAccount();
  let plans; try { plans = await service.plans(); } catch { return <><PageHeader title="Planos" /><ContentError label="os planos" /></>; }
  return <div><header className="plans-reference-intro"><AppIcon name="crown" size={38} /><h1>Nossos planos</h1><p>Escolha o cuidado ideal para você<br />e comece hoje a sua transformação!</p></header><div className="plans-list">{plans.length ? plans.map(plan => <PlanCard plan={plan} key={plan.id} />) : <EmptyState title="Nenhum plano disponível" description="Os planos aparecerão aqui quando forem liberados." />}</div><p className="plans-availability">Assinatura online em breve. Conheça os detalhes de cada plano.</p></div>;
}
