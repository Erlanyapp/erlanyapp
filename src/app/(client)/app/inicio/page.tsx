import Link from "next/link";
import { Card } from "@/components/ui";
import { HomeDailyWorkout } from "@/components/client/home-daily-workout";
import { AppHeader } from "@/components/layout/app-header";
import { getContentService } from "@/services/server-content";
import { getClientAccount } from "@/services/server-account";
import { AppIcon } from "@/components/icons";

export default async function HomePage() {
  const [{ account }, service] = await Promise.all([getClientAccount(), getContentService()]);
  let loadError = !service;
  const workouts = service ? await service.listAssignedWorkouts().catch(() => { loadError = true; return []; }) : [];
  const dailyWorkout = workouts[0];
  const checkedIn = service && dailyWorkout
    ? await service.getTodayWorkoutCheckin(dailyWorkout.assignmentId).then(Boolean).catch(() => false)
    : false;
  return <div className="home-page">
    <section className="home-hero" aria-label="Seu cuidado de hoje"><AppHeader account={account} /><HomeDailyWorkout workout={dailyWorkout} loadError={loadError} checkedIn={checkedIn} /></section>
    <div className="home-body">
      <nav className="quick-grid" aria-label="Atalhos da Home">
        <Link href="/app/evolucao"><Card><span className="quick-icon"><AppIcon name="progress" size={30} /></span><strong>Meu<br />progresso</strong></Card></Link>
        <Link href="/app/alimentacao"><Card><span className="quick-icon"><AppIcon name="nutrition" size={30} /></span><strong>Minha<br />alimentação</strong></Card></Link>
        <Link href="/app/dicas"><Card><span className="quick-icon"><AppIcon name="tips" size={30} /></span><strong>Dicas da<br />Erlany</strong></Card></Link>
      </nav>
      <Card className="quote-card"><svg className="quote-mark" viewBox="0 0 32 32" aria-hidden="true"><path d="M14 6C6 9 3 15 3 22h11V12H8c1-2 3-4 6-5V6Zm15 0c-8 3-11 9-11 16h11V12h-6c1-2 3-4 6-5V6Z" fill="currentColor" /></svg><p>“Corpo saudável,<br />mente mais forte!”</p><svg className="quote-mark quote-mark-end" viewBox="0 0 32 32" aria-hidden="true"><path d="M14 6C6 9 3 15 3 22h11V12H8c1-2 3-4 6-5V6Zm15 0c-8 3-11 9-11 16h11V12h-6c1-2 3-4 6-5V6Z" fill="currentColor" /></svg></Card>
    </div>
  </div>;
}
