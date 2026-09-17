import { PageHeader } from "@/components/ui";
import { TabNavigation } from "@/components/client/client-components";

export function ContentSkeleton({ label = "conteúdo", rows = 3 }: { label?: string; rows?: number }) {
  return <div className="client-route-skeleton" data-route-pending role="status" aria-label={`Carregando ${label}`}>
    <span className="perf-sr-only">Carregando {label}…</span>
    <div className="client-skeleton-stack" aria-hidden="true">{Array.from({ length: rows }, (_, index) => <div className="card client-skeleton-card" key={index}><span className="client-skeleton-line" /><span className="client-skeleton-line short" /></div>)}</div>
  </div>;
}

export function RouteSkeleton({ title, tabs, selected, basePath, backHref }: { title: string; tabs?: string[]; selected?: string; basePath?: string; backHref?: string }) {
  return <div><PageHeader title={title} back backHref={backHref} />{tabs && basePath && <TabNavigation tabs={tabs} selected={selected ?? tabs[0]} basePath={basePath} />}<ContentSkeleton label={title.toLowerCase()} /></div>;
}

export function HomeHeaderSkeleton() {
  return <header className="app-header" data-route-pending role="status" aria-label="Carregando seu perfil"><div className="home-greeting"><span className="profile-avatar client-skeleton-line" aria-hidden="true" /><div><h1>Olá,</h1><p>Disciplina hoje,<br />resultados amanhã!</p></div></div></header>;
}

export function DailyWorkoutSkeleton() {
  return <article className="home-daily-card" data-route-pending role="status" aria-label="Carregando seu treino"><div className="home-daily-copy"><p className="home-daily-kicker">TREINO DO DIA</p><div aria-hidden="true"><span className="client-skeleton-line" /><span className="client-skeleton-line short" /></div></div></article>;
}
