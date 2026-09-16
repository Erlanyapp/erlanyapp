import Image from "next/image";
import Link from "next/link";
import { AppIcon } from "@/components/icons";
import { RetryContent } from "./retry-content";
import type { Workout } from "@/types/content";

export function HomeDailyWorkout({ workout, loadError }: { workout?: Workout; loadError: boolean }) {
  return <article className={`home-daily-card${workout?.coverUrl ? " has-cover" : ""}`} aria-labelledby="daily-workout-title">
    {workout?.coverUrl && <div className="home-daily-image"><Image src={workout.coverUrl} alt="" fill sizes="(max-width: 480px) 60vw, 260px" unoptimized /></div>}
    <div className="home-daily-copy">
      <p className="home-daily-kicker">TREINO DO DIA</p>
      <h2 id="daily-workout-title">{loadError ? "Não foi possível carregar" : workout?.name ?? "Seu próximo treino"}</h2>
      {loadError ? <><p role="alert">Tente novamente para consultar seu treino.</p><RetryContent /></>
        : workout ? <>{workout.category && <p className="home-daily-description">{workout.category}{workout.durationMinutes ? ` · ${workout.durationMinutes} min` : ""}</p>}<Link className="button button-primary" href={`/app/treinos/${workout.id}`}>Começar treino</Link></>
          : <><p className="home-daily-description">Aparecerá aqui assim que for liberado para você.</p><Link className="home-daily-link" href="/app/treinos?tab=Meus+treinos">Ver meus treinos<AppIcon name="arrow-right" size={17} /></Link></>}
    </div>
    {!workout?.coverUrl && <span className="home-daily-mark" aria-hidden="true"><AppIcon name="workout" size={52} /></span>}
  </article>;
}
