import { PageHeader } from "@/components/ui";
import { PlanCard } from "@/components/client/client-components";
import { plans } from "@/data/client-mocks";
export default function PlansPage() { return <div><PageHeader title="Planos" /><p className="plans-intro">Escolha o cuidado que combina com você.</p><div className="plans-list">{plans.map((plan) => <PlanCard plan={plan} key={plan.name} />)}</div></div>; }
