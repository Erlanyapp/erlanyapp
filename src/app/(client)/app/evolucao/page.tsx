import { PageHeader, EmptyState } from "@/components/ui";
import { MetricCard, ProgressCard, TabNavigation } from "@/components/client/client-components";
import { getContentService } from "@/services/server-content";
import { ContentError } from "@/components/client/content-states";
export default async function ProgressPage() { const service = await getContentService(); if (!service) return <div><PageHeader title="Minha evolução" /><ContentError label="sua evolução" /></div>; try { const photos = await service.listProgressPhotos(); return <div><PageHeader title="Minha evolução" /><TabNavigation tabs={["Peso", "Medidas", "Fotos", "Desempenho"]} selected="Peso" /><div className="metric-grid"><MetricCard label="Peso atual" value="—" /><MetricCard label="Meta" value="—" /></div><ProgressCard /><EmptyState title={photos.length ? `${photos.length} foto${photos.length === 1 ? "" : "s"} de evolução` : "Cada passo conta"} description={photos.length ? "Suas fotos de evolução estão protegidas no seu perfil." : "Registre seus dados para visualizar sua evolução."} /></div>; } catch { return <div><PageHeader title="Minha evolução" /><ContentError label="sua evolução" /></div>; }
}
