import Link from "next/link";
import { Card, SectionHeader } from "@/components/ui";
import type { Category } from "@/data/client-mocks";
import type { ProgressWeight, Workout, Tip, WorkoutVideo } from "@/types/content";
import type { MembershipPlan } from "@/types/account";
import { videoProviders } from "@/lib/content/video-provider";
import { AppIcon, iconNameFromSymbol } from "@/components/icons";

export function Hero({ eyebrow, title, description, icon = "✦", className = "" }: { eyebrow?: string; title: React.ReactNode; description?: string; icon?: string; className?: string }) {
  return <Card className={`content-hero ${className}`}><div>{eyebrow && <p className="eyebrow">{eyebrow}</p>}<h2>{title}</h2>{description && <p>{description}</p>}</div><span aria-hidden="true"><AppIcon name={iconNameFromSymbol(icon)} size={54} /></span></Card>;
}

export function TabNavigation({ tabs, selected, basePath }: { tabs: string[]; selected: string; basePath: string }) {
  return <nav className="segmented" aria-label="Filtrar conteúdo">{tabs.map(tab => <Link href={`${basePath}?tab=${encodeURIComponent(tab)}`} aria-current={tab === selected ? "page" : undefined} className={tab === selected ? "selected" : ""} key={tab}>{tab}</Link>)}</nav>;
}

export function CategoryCard({ category }: { category: Category }) {
  return <Card className="category-row"><span className={`category-art ${category.tone}`}><AppIcon name={iconNameFromSymbol(category.icon)} size={21} /></span><span><strong>{category.name}</strong><small>{category.subtitle}</small></span></Card>;
}

export function WorkoutCard({ workout }: { workout: Workout }) {
  return <Link className="card workout-feature" href={`/app/treinos/${workout.id}`}>{workout.coverUrl && <span className="workout-cover" style={{ backgroundImage: `url(${workout.coverUrl})` }} aria-hidden="true" />}<div className="workout-copy"><p className="eyebrow">{workout.category ?? "TREINO"}{workout.durationMinutes ? ` · ${workout.durationMinutes} MIN` : ""}{workout.level ? ` · ${workout.level}` : ""}</p><h2>{workout.name}</h2>{workout.description && <p className="muted">{workout.description}</p>}<span className="button button-primary">Começar treino</span></div><div className="workout-orb" aria-hidden="true"><AppIcon name="workout" size={54} /></div></Link>;
}

export function VideoPlayer({ video }: { video?: WorkoutVideo | null }) {
  const source = video && videoProviders[video.provider]?.getEmbedSource(video);
  return source ? <div className="video-player"><iframe title={video!.title} src={source} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen /></div> : <p className="muted">Vídeo demonstrativo ainda não disponível.</p>;
}

export function MetricCard({ label, value }: { label: string; value: string }) { return <Card className="metric-card"><strong>{value}</strong><small>{label}</small></Card>; }

export function ProgressCard({ weights = [] }: { weights?: ProgressWeight[] }) {
  const current = weights[0];
  return <Card className="progress-card"><div className="progress-summary"><div><p className="muted">Meu peso</p><strong>{current ? `${current.value} kg` : "—"}</strong></div><span className="progress-change">{current ? `Atualizado em ${new Date(`${current.recordedAt}T12:00:00`).toLocaleDateString("pt-BR")}` : "Acompanhe seu progresso"}</span></div>{weights.length ? <div className="progress-history">{weights.map((weight) => <div className="progress-history-row" key={weight.id}><span>{new Date(`${weight.recordedAt}T12:00:00`).toLocaleDateString("pt-BR")}</span><strong>{weight.value} kg</strong></div>)}</div> : <div className="chart-placeholder" aria-label="Histórico de peso vazio"><span>Seu histórico aparecerá aqui</span></div>}</Card>;
}

export function TipCard({ tip }: { tip: Tip }) { return <Link className="card tip-card" href={`/app/dicas/${tip.id}`}><span className="tip-icon"><AppIcon name="sparkle" /></span><div><small>{tip.categoryName ?? "Dica"}</small><strong>{tip.title}</strong>{tip.summary && <p className="muted">{tip.summary}</p>}</div><AppIcon name="arrow-right" className="row-arrow" size={19} /></Link>; }
export function FoodCard({ title, description, icon }: { title: string; description: string; icon: string }) { return <Card className="food-card"><span className="food-icon"><AppIcon name={iconNameFromSymbol(icon)} /></span><div><strong>{title}</strong><p>{description}</p></div></Card>; }

export function PlanCard({ plan }: { plan: MembershipPlan }) { return <Link className="card plan-card" href={`/app/planos/${plan.id}`}><div><h2>{plan.name}</h2><p className="muted">{plan.description}</p><p className="plan-price">{new Intl.NumberFormat("pt-BR", { style: "currency", currency: plan.currency }).format(plan.priceCents / 100)}</p></div><AppIcon name="arrow-right" size={20} /></Link>; }

export function SectionCards({ title, children }: { title: string; children: React.ReactNode }) { return <section><SectionHeader title={title} />{children}</section>; }
