import { PageHeader, EmptyState } from "@/components/ui";
import { MetricCard, ProgressCard, TabNavigation } from "@/components/client/client-components";
export default function ProgressPage() { return <div><PageHeader title="Minha evolução" /><TabNavigation tabs={["Peso", "Medidas", "Fotos", "Desempenho"]} selected="Peso" /><div className="metric-grid"><MetricCard label="Peso atual" value="—" /><MetricCard label="Meta" value="—" /></div><ProgressCard /><EmptyState title="Cada passo conta" description="Registre seus dados para visualizar sua evolução." /></div>; }
