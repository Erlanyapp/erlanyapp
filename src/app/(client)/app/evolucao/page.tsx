import Image from "next/image";
import type { ProgressWeight, ProgressMeasurement, ProgressPhoto, PerformanceRecord } from "@/types/content";
import { PageHeader, EmptyState } from "@/components/ui";
import { MetricCard, ProgressCard, TabNavigation } from "@/components/client/client-components";
import { WeightForm } from "@/components/client/account-forms";
import { getContentService } from "@/services/server-content";
import { ContentError } from "@/components/client/content-states";

const tabs = ["Peso", "Medidas", "Fotos", "Desempenho"];
const formatDate = (date: string) => new Date(`${date}T12:00:00`).toLocaleDateString("pt-BR");
function NoRecords({ label }: { label: string }) {
  return <EmptyState title={`Sem registros de ${label.toLowerCase()}`} description="Seus registros aparecerão aqui quando forem liberados." />;
}
export default async function ProgressPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { tab } = await searchParams;
  const selected = tab && tabs.includes(tab) ? tab : "Peso";
  const service = await getContentService();
  if (!service) return <><PageHeader title="Minha evolução" /><ContentError label="sua evolução" /></>;
  try {
    const panel = selected === "Peso" ? <WeightPanel weights={await service.listProgressWeights()} />
      : selected === "Medidas" ? <MeasurementsPanel records={await service.listProgressMeasurements()} />
      : selected === "Fotos" ? <PhotosPanel photos={await service.listProgressPhotos()} />
      : <PerformancePanel records={await service.listPerformanceRecords()} />;
    return <div><PageHeader title="Minha evolução" /><TabNavigation tabs={tabs} selected={selected} basePath="/app/evolucao" />{panel}</div>;
  } catch { return <><PageHeader title="Minha evolução" /><ContentError label="sua evolução" /></>; }
}
function WeightPanel({ weights }: { weights: ProgressWeight[] }) {
  return <><div className="metric-grid"><MetricCard label="Peso atual" value={weights[0] ? `${weights[0].value} kg` : "—"} /><MetricCard label="Registros" value={String(weights.length)} /></div><ProgressCard weights={weights} /><WeightForm /></>;
}
function MeasurementsPanel({ records }: { records: ProgressMeasurement[] }) {
  return records.length ? <div className="content-list">{records.map(record => <article className="card account-panel" key={record.id}><h2>{formatDate(record.recordedAt)}</h2><dl className="account-data">{Object.entries(record.measurements).filter(([, value]) => value != null).map(([key, value]) => <div key={key}><dt>{key}</dt><dd>{String(value)}</dd></div>)}</dl></article>)}</div> : <NoRecords label="Medidas" />;
}
function PhotosPanel({ photos }: { photos: ProgressPhoto[] }) {
  return <>{photos.length ? <div className="photo-grid">{photos.map(photo => <details className="card action-details photo-card" key={photo.id}><summary>{photo.category ?? "Foto"} · {formatDate(photo.recordedAt)}</summary>{photo.imageUrl ? <Image className="progress-photo" src={photo.imageUrl} alt={`Foto de evolução: ${photo.category ?? "registro"}`} width={480} height={640} unoptimized /> : <p>Imagem ainda não disponível.</p>}</details>)}</div> : <NoRecords label="Fotos" />}<p className="muted">O envio de fotos de evolução ainda não está disponível nesta etapa.</p></>;
}
function PerformancePanel({ records }: { records: PerformanceRecord[] }) {
  return records.length ? <div className="content-list">{records.map(record => <article className="card account-panel" key={record.id}><h2>{record.metric}</h2><strong>{record.value == null ? "—" : `${record.value} ${record.unit ?? ""}`}</strong><small>{formatDate(record.recordedAt)}</small></article>)}</div> : <NoRecords label="Desempenho" />;
}
