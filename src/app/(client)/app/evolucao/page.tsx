import { PageHeader, EmptyState } from "@/components/ui";
import { MetricCard, ProgressCard, TabNavigation } from "@/components/client/client-components";
import { getContentService } from "@/services/server-content";
import { ContentError } from "@/components/client/content-states";
export default async function ProgressPage() {
  const service = await getContentService();
  if (!service) return <div><PageHeader title="Minha evolução" /><ContentError label="sua evolução" /></div>;
  try {
    const [weights, measurements, photos, performance] = await Promise.all([service.listProgressWeights(), service.listProgressMeasurements(), service.listProgressPhotos(), service.listPerformanceRecords()]);
    const latestMeasurement = measurements[0];
    const measurementEntries = latestMeasurement ? Object.entries(latestMeasurement.measurements).filter(([, value]) => value != null) : [];
    return <div><PageHeader title="Minha evolução" /><TabNavigation tabs={["Peso", "Medidas", "Fotos", "Desempenho"]} selected="Peso" /><div className="metric-grid"><MetricCard label="Peso atual" value={weights[0] ? `${weights[0].value} kg` : "—"} /><MetricCard label="Registros" value={String(weights.length)} /></div><ProgressCard weights={weights} /><section className="progress-section"><h2>Medidas</h2>{measurementEntries.length ? <div className="content-list">{measurementEntries.map(([key, value]) => <div className="card progress-history-row" key={key}><span>{key}</span><strong>{String(value)}</strong></div>)}</div> : <EmptyState title="Sem medidas registradas" description="Suas principais medidas aparecerão aqui quando houver registros." />}</section><section className="progress-section"><h2>Fotos de evolução</h2><EmptyState title={photos.length ? `${photos.length} foto${photos.length === 1 ? "" : "s"} protegida${photos.length === 1 ? "" : "s"}` : "Cada passo conta"} description={photos.length ? "Suas fotos estão protegidas no seu perfil." : "Suas fotos de evolução aparecerão aqui quando forem registradas."} /></section><section className="progress-section"><h2>Desempenho</h2>{performance.length ? <div className="content-list">{performance.map((record) => <div className="card progress-history-row" key={record.id}><span>{record.metric}<small>{new Date(`${record.recordedAt}T12:00:00`).toLocaleDateString("pt-BR")}</small></span><strong>{record.value == null ? "—" : `${record.value}${record.unit ? ` ${record.unit}` : ""}`}</strong></div>)}</div> : <EmptyState title="Sem desempenho registrado" description="Seu histórico de desempenho aparecerá aqui quando houver registros." />}</section></div>;
  } catch { return <div><PageHeader title="Minha evolução" /><ContentError label="sua evolução" /></div>; }
}
