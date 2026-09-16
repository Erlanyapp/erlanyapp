import Link from "next/link";
import { Card, PageHeader } from "@/components/ui";
import { MetricCard, VideoPlayer } from "@/components/client/client-components";
import { AppIcon } from "@/components/icons";

export default function ExercisePage() {
  return <div><PageHeader title="Agachamento Livre" back /><VideoPlayer /><div className="metric-grid exercise-metrics"><MetricCard label="Séries" value="3" /><MetricCard label="Repetições" value="12" /><MetricCard label="Descanso" value="60s" /></div><Card className="tip-note"><span><AppIcon name="tips" /></span><div><strong>Dica da Erlany</strong><p>Mantenha o peito aberto e os joelhos alinhados aos pés.</p></div></Card><Link className="button button-primary full-width exercise-cta" href="/app/treinos">Começar exercício</Link></div>;
}
