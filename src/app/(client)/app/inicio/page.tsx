import Link from "next/link";
import { Card, EmptyState, SectionHeader } from "@/components/ui";
import { WorkoutCard } from "@/components/client/client-components";
import { getContentService } from "@/services/server-content";
import { ContentError } from "@/components/client/content-states";
import { AppIcon } from "@/components/icons";

export default async function HomePage() {
  const service = await getContentService();
  let loadError = !service;
  const workouts = service ? await service.listWorkouts().catch(() => { loadError = true; return []; }) : [];
  return <div className="home-page"><section><SectionHeader title="Treino do dia" action={<span className="section-kicker">PRÓXIMO</span>} />{loadError ? <ContentError label="seu treino do dia" /> : workouts[0] ? <WorkoutCard workout={workouts[0]} /> : <EmptyState title="Nenhum treino disponível" description="Seu próximo treino aparecerá aqui quando for liberado." />}</section><section><SectionHeader title="Atalhos" /><div className="quick-grid"><Link href="/app/evolucao"><Card><span className="quick-icon"><AppIcon name="progress" /></span><strong>Meu<br />progresso</strong></Card></Link><Link href="/app/alimentacao"><Card><span className="quick-icon"><AppIcon name="nutrition" /></span><strong>Minha<br />alimentação</strong></Card></Link><Link href="/app/dicas"><Card><span className="quick-icon"><AppIcon name="tips" /></span><strong>Dicas da<br />Erlany</strong></Card></Link></div></section><Card className="quote-card"><span>“</span><p>Corpo saudável,<br />mente mais forte!</p><span>”</span></Card></div>;
}
