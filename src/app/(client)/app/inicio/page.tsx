import Link from "next/link";
import { BrandLogo } from "@/components/branding/brand-logo";
import { Card, SectionHeader } from "@/components/ui";
import { WorkoutCard } from "@/components/client/client-components";

export default function HomePage() {
  return <div className="home-page"><div className="welcome"><div><p className="eyebrow">BOM DIA, JULIANA</p><h1>Olá, Juliana!</h1><p>Disciplina hoje,<br />resultados amanhã!</p></div><BrandLogo variant="compact" /></div><section><SectionHeader title="Treino do dia" action={<span className="section-kicker">PRÓXIMO</span>} /><WorkoutCard /></section><section><SectionHeader title="Atalhos" /><div className="quick-grid"><Link href="/app/evolucao"><Card><span className="quick-icon">⌁</span><strong>Meu<br />progresso</strong></Card></Link><Link href="/app/alimentacao"><Card><span className="quick-icon">♧</span><strong>Minha<br />alimentação</strong></Card></Link><Link href="/app/dicas"><Card><span className="quick-icon">♡</span><strong>Dicas da<br />Erlany</strong></Card></Link></div></section><Card className="quote-card"><span>“</span><p>Corpo saudável,<br />mente mais forte!</p><span>”</span></Card></div>;
}
