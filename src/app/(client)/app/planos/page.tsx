import { PageHeader, EmptyState } from "@/components/ui";
import { PlanCard } from "@/components/client/client-components";
import { getClientAccount } from "@/services/server-account";
import { ContentError } from "@/components/client/content-states";
export default async function PlansPage() {
  const { service } = await getClientAccount();
  let plans; try { plans = await service.plans(); } catch { return <><PageHeader title="Planos" /><ContentError label="os planos" /></>; }
  return <div><PageHeader title="Planos" back /><p className="plans-intro">Conheça o cuidado que combina com você. Assinatura online em breve.</p><div className="plans-list">{plans.length ? plans.map(plan => <PlanCard plan={plan} key={plan.id} />) : <EmptyState title="Nenhum plano disponível" description="Os planos aparecerão aqui quando forem liberados." />}</div></div>;
}
