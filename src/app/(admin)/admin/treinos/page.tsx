import Link from "next/link";
import { requireAdmin } from "@/lib/supabase/admin";
import { createAdminWorkoutService } from "@/services/admin-workout-service";
import type { AdminWorkout } from "@/types/admin-workout";
import { toggleWorkout } from "./actions";

const weekdays = [
  "SEGUNDA-FEIRA", "TERÇA-FEIRA", "QUARTA-FEIRA", "QUINTA-FEIRA",
  "SEXTA-FEIRA", "SÁBADO", "DOMINGO",
];

function WorkoutRow({ workout }: { workout: AdminWorkout }) {
  return <article className="card content-list-row" key={workout.id}>
    <span><strong>{workout.name}</strong><small>{workout.exerciseCount} exercício(s) · {workout.scope}</small></span>
    <Link href={`/admin/treinos/${workout.id}`}>Abrir</Link>
    <form action={toggleWorkout.bind(null, workout.id, !workout.isActive)}><button>{workout.isActive ? "Desativar" : "Ativar"}</button></form>
  </article>;
}

export default async function WorkoutsAdminPage({ searchParams }: { searchParams: Promise<{ q?: string; status?: string; scope?: string; page?: string }> }) {
  const filters = await searchParams;
  const service = createAdminWorkoutService((await requireAdmin()).client);
  const data = await service.list(filters);
  const scheduledGroups = weekdays.map((label, weekday) => ({
    label,
    weekday,
    workouts: data.items.filter((workout) => workout.scheduledWeekdays.includes(weekday)),
  })).filter((group) => group.workouts.length > 0);
  const withoutSchedule = data.items.filter((workout) => workout.scheduledWeekdays.length === 0);
  const query = `q=${encodeURIComponent(filters.q ?? "")}&status=${encodeURIComponent(filters.status ?? "")}&scope=${encodeURIComponent(filters.scope ?? "")}`;

  return <div>
    <div className="crm-page-heading"><div><p className="admin-overline">BIBLIOTECA DE TREINOS</p><h2>Treinos</h2></div><Link className="button button-primary" href="/admin/treinos/novo">+ Novo treino</Link></div>
    <form className="crm-filters">
      <input name="q" defaultValue={filters.q} placeholder="Buscar treino" />
      <select name="status" defaultValue={filters.status ?? "all"}><option value="all">Todos</option><option value="active">Ativos</option><option value="inactive">Inativos</option></select>
      <select name="scope" defaultValue={filters.scope ?? "all"}><option value="all">Todos os escopos</option><option>GLOBAL</option><option>CLIENT</option></select>
      <button className="button button-primary">Filtrar</button>
    </form>
    <section className="crm-table-panel">
      {!data.items.length ? <p className="crm-empty">Nenhum treino encontrado.</p> : <div className="admin-workout-week-list">
        {scheduledGroups.map((group) => <section className="admin-workout-day-group" key={group.weekday}>
          <h3>{group.label}<span>{group.workouts.length} {group.workouts.length === 1 ? "treino" : "treinos"}</span></h3>
          <div className="content-list">{group.workouts.map((workout) => <WorkoutRow workout={workout} key={workout.id} />)}</div>
        </section>)}
        {withoutSchedule.length > 0 && <section className="admin-workout-day-group admin-workout-day-group-unscheduled">
          <h3>SEM AGENDA SEMANAL<span>{withoutSchedule.length} {withoutSchedule.length === 1 ? "treino" : "treinos"}</span></h3>
          <div className="content-list">{withoutSchedule.map((workout) => <WorkoutRow workout={workout} key={workout.id} />)}</div>
        </section>}
      </div>}
    </section>
    <nav className="admin-pagination"><span>{data.total} treino(s)</span>{data.page > 1 ? <Link href={`?${query}&page=${data.page - 1}`}>Anterior</Link> : null}{data.page * data.pageSize < data.total ? <Link href={`?${query}&page=${data.page + 1}`}>Próxima</Link> : null}</nav>
  </div>;
}
