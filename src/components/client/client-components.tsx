import Link from "next/link";
import { Card, SectionHeader } from "@/components/ui";
import type { Category, Plan, Tip } from "@/data/client-mocks";
import type { ProgressWeight, Workout, Tip as ContentTip } from "@/types/content";
import { videoProviders } from "@/lib/content/video-provider";
import { AppIcon, iconNameFromSymbol } from "@/components/icons";

export function Hero({ eyebrow, title, description, icon = "✦", className = "" }: { eyebrow?: string; title: string; description?: string; icon?: string; className?: string }) {
  return <Card className={`content-hero ${className}`}><div>{eyebrow && <p className="eyebrow">{eyebrow}</p>}<h2>{title}</h2>{description && <p>{description}</p>}</div><span aria-hidden="true"><AppIcon name={iconNameFromSymbol(icon)} size={54} /></span></Card>;
}

export function TabNavigation({ tabs, selected }: { tabs: string[]; selected: string }) {
  return <div className="segmented" role="tablist">{tabs.map((tab) => <span role="tab" aria-selected={tab === selected} className={tab === selected ? "selected" : ""} key={tab}>{tab}</span>)}</div>;
}

export function CategoryCard({ category }: { category: Category }) {
  return <Card className="category-row"><span className={`category-art ${category.tone}`}><AppIcon name={iconNameFromSymbol(category.icon)} size={21} /></span><span><strong>{category.name}</strong><small>{category.subtitle}</small></span><AppIcon name="arrow-right" className="row-arrow" size={19} /></Card>;
}

export function WorkoutCard({ workout }: { workout: Workout }) {
  return <Card className="workout-feature">{workout.coverUrl && <span className="workout-cover" style={{ backgroundImage: `url(${workout.coverUrl})` }} aria-hidden="true" />}<div><p className="eyebrow">{workout.category ?? "TREINO"}{workout.durationMinutes ? ` · ${workout.durationMinutes} MIN` : ""}{workout.level ? ` · ${workout.level}` : ""}</p><h2>{workout.name}</h2>{workout.description && <p className="muted">{workout.description}</p>}<Link className="button button-primary" href={`/app/treinos/${workout.id}`}>Ver treino</Link></div><div className="workout-orb" aria-hidden="true">✦</div></Card>;
}

export function VideoPlayer({ videoId, title = "Vídeo demonstrativo" }: { videoId?: string; title?: string }) {
  if (!videoId) return <div className="video-player" role="img" aria-label={title}><span className="video-play">▶</span><small>Vídeo demonstrativo</small></div>;
  const source = videoProviders.youtube?.getEmbedSource({ providerVideoId: videoId });
  return source ? <div className="video-player"><iframe title={title} src={source} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen /></div> : <div className="video-player" role="img" aria-label={title}><small>Vídeo indisponível</small></div>;
}

export function MetricCard({ label, value }: { label: string; value: string }) { return <Card className="metric-card"><strong>{value}</strong><small>{label}</small></Card>; }

export function ProgressCard({ weights = [] }: { weights?: ProgressWeight[] }) {
  const current = weights[0];
  return <Card className="progress-card"><div className="progress-summary"><div><p className="muted">Meu peso</p><strong>{current ? `${current.value} kg` : "—"}</strong></div><span className="progress-change">{current ? `Atualizado em ${new Date(`${current.recordedAt}T12:00:00`).toLocaleDateString("pt-BR")}` : "Acompanhe seu progresso"}</span></div>{weights.length ? <div className="progress-history">{weights.map((weight) => <div className="progress-history-row" key={weight.id}><span>{new Date(`${weight.recordedAt}T12:00:00`).toLocaleDateString("pt-BR")}</span><strong>{weight.value} kg</strong></div>)}</div> : <div className="chart-placeholder" aria-label="Histórico de peso vazio"><span>Seu histórico aparecerá aqui</span></div>}<button className="button button-primary full-width" type="button">Registrar peso</button></Card>;
}

export function TipCard({ tip }: { tip: Tip | ContentTip }) { return <Card className="tip-card"><span className="tip-icon"><AppIcon name={"icon" in tip ? iconNameFromSymbol(tip.icon) : "sparkle"} /></span><div><small>{"category" in tip ? tip.category : "Dica"}</small><strong>{tip.title}</strong>{"summary" in tip && tip.summary && <p className="muted">{tip.summary}</p>}{!(("summary" in tip) && tip.summary) && "content" in tip && <p className="muted">{tip.content}</p>}</div><AppIcon name="arrow-right" className="row-arrow" size={19} /></Card>; }
export function FoodCard({ title, description, icon }: { title: string; description: string; icon: string }) { return <Card className="food-card"><span className="food-icon"><AppIcon name={iconNameFromSymbol(icon)} /></span><div><strong>{title}</strong><p>{description}</p></div><AppIcon name="arrow-right" className="row-arrow" size={19} /></Card>; }

export function PlanCard({ plan }: { plan: Plan }) { return <Card className={`plan-card ${plan.featured ? "featured" : ""}`}>{plan.featured && <span className="plan-badge">MAIS ESCOLHIDO</span>}<p className="eyebrow">{plan.name.toUpperCase()}</p><h2>{plan.price}</h2><p className="muted">{plan.description}</p><ul>{plan.features.map((feature) => <li key={feature}>✓ {feature}</li>)}</ul><button className={`button ${plan.featured ? "button-primary" : "button-outline"}`} type="button">Conhecer plano</button></Card>; }

export function SectionCards({ title, children }: { title: string; children: React.ReactNode }) { return <section><SectionHeader title={title} />{children}</section>; }
