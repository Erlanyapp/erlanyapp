import Link from "next/link";
import { Card, SectionHeader } from "@/components/ui";
import type { Category, Plan, Tip } from "@/data/client-mocks";

export function Hero({ eyebrow, title, description, icon = "✦", className = "" }: { eyebrow?: string; title: string; description?: string; icon?: string; className?: string }) {
  return <Card className={`content-hero ${className}`}><div>{eyebrow && <p className="eyebrow">{eyebrow}</p>}<h2>{title}</h2>{description && <p>{description}</p>}</div><span aria-hidden="true">{icon}</span></Card>;
}

export function TabNavigation({ tabs, selected }: { tabs: string[]; selected: string }) {
  return <div className="segmented" role="tablist">{tabs.map((tab) => <span role="tab" aria-selected={tab === selected} className={tab === selected ? "selected" : ""} key={tab}>{tab}</span>)}</div>;
}

export function CategoryCard({ category }: { category: Category }) {
  return <Card className="category-row"><span className={`category-art ${category.tone}`} aria-hidden="true">{category.icon}</span><span><strong>{category.name}</strong><small>{category.subtitle}</small></span><b aria-hidden="true">›</b></Card>;
}

export function WorkoutCard() {
  return <Card className="workout-feature"><div><p className="eyebrow">TREINO DO DIA · 25 MIN</p><h2>Pernas e Glúteos</h2><p className="muted">Força e definição para você.</p><Link className="button button-primary" href="/app/exercicio">Ver treino</Link></div><div className="workout-orb" aria-hidden="true">✦</div></Card>;
}

export function VideoPlayer() {
  return <div className="video-player" role="img" aria-label="Prévia do vídeo Agachamento Livre"><span className="video-play">▶</span><small>Vídeo demonstrativo</small></div>;
}

export function MetricCard({ label, value }: { label: string; value: string }) { return <Card className="metric-card"><strong>{value}</strong><small>{label}</small></Card>; }

export function ProgressCard() {
  return <Card className="progress-card"><div className="progress-summary"><div><p className="muted">Meu peso</p><strong>—</strong></div><span className="progress-change">Acompanhe<br />seu progresso</span></div><div className="chart-placeholder" aria-label="Gráfico sem dados"><span>Seu histórico aparecerá aqui</span>{[1, 2, 3, 4, 5].map((point) => <i key={point} />)}</div><button className="button button-primary full-width" type="button">Registrar peso</button></Card>;
}

export function TipCard({ tip }: { tip: Tip }) { return <Card className="tip-card"><span className="tip-icon">{tip.icon}</span><div><small>{tip.category}</small><strong>{tip.title}</strong></div><b aria-hidden="true">›</b></Card>; }
export function FoodCard({ title, description, icon }: { title: string; description: string; icon: string }) { return <Card className="food-card"><span className="food-icon">{icon}</span><div><strong>{title}</strong><p>{description}</p></div><b aria-hidden="true">›</b></Card>; }

export function PlanCard({ plan }: { plan: Plan }) { return <Card className={`plan-card ${plan.featured ? "featured" : ""}`}>{plan.featured && <span className="plan-badge">MAIS ESCOLHIDO</span>}<p className="eyebrow">{plan.name.toUpperCase()}</p><h2>{plan.price}</h2><p className="muted">{plan.description}</p><ul>{plan.features.map((feature) => <li key={feature}>✓ {feature}</li>)}</ul><button className={`button ${plan.featured ? "button-primary" : "button-outline"}`} type="button">Conhecer plano</button></Card>; }

export function SectionCards({ title, children }: { title: string; children: React.ReactNode }) { return <section><SectionHeader title={title} />{children}</section>; }
