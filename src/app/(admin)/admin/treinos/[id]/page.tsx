import Link from "next/link";
import { notFound } from "next/navigation";

import { WorkoutEditor } from "@/components/admin/workout-editor";
import { requireAdmin } from "@/lib/supabase/admin";
import { createAdminWorkoutService } from "@/services/admin-workout-service";
import type { AdminWorkoutClient } from "@/repositories/admin-workout-repository";

import {
  addWorkoutExercise,
  assignWorkout,
  cancelAssignment,
  moveWorkoutExercise,
  removeWorkoutExercise,
  toggleAssignment,
  updateAssignment,
  updateWorkoutExercise,
} from "../actions";

const days = [
  "Segunda",
  "Terça",
  "Quarta",
  "Quinta",
  "Sexta",
  "Sábado",
  "Domingo",
];

type ExerciseEntry = {
  id: string;
  exercise_id: string;
  position: number;
  sets?: number | null;
  repetitions?: string | null;
  load?: string | null;
  rest_seconds?: number | null;
  duration_seconds?: number | null;
  notes?: string | null;
  exercise?: { name?: string | null } | null;
};

type AssignmentEntry = {
  id: string;
  client_id: string;
  starts_on: string;
  ends_on?: string | null;
  is_active: boolean;
  client?: { id: string; profile?: Profile | Profile[] | null } | null;
  schedule?: { weekday: number; schedule_kind: string }[] | null;
};

type Profile = { full_name?: string | null };

const clientName = (client?: AssignmentEntry["client"]) => {
  const profile = client?.profile;
  const name = Array.isArray(profile) ? profile[0]?.full_name : profile?.full_name;
  return name?.trim() || "Cliente sem nome";
};

export default async function WorkoutDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const workoutId = (await params).id;
  const admin = await requireAdmin();
  const service = createAdminWorkoutService(admin.client);

  const [item, clients, exercises, assignments] = await Promise.all([
    service.get(workoutId),
    service.clients(),
    service.exercises(),
    service.assignments(workoutId),
  ]);

  if (!item) {
    notFound();
  }

  const composition = ((item.workout_exercises ?? []) as ExerciseEntry[]).sort(
    (left, right) => left.position - right.position,
  );

  return (
    <div>
      <Link className="admin-back" href="/admin/treinos">
        Voltar para treinos
      </Link>

      <WorkoutEditor item={item} clients={clients} />

      <section className="crm-table-panel">
        <h3>Montador de exercícios</h3>

        {composition.map((entry, index) => (
          <article className="card" key={entry.id}>
            <strong>{entry.exercise?.name ?? "Exercício"}</strong>

            <form
              action={updateWorkoutExercise.bind(null, workoutId, entry.id)}
              className="crm-filters"
            >
              <input name="exerciseId" type="hidden" value={entry.exercise_id} />
              <label>
                Séries
                <input name="sets" type="number" defaultValue={entry.sets ?? ""} />
              </label>
              <label>
                Repetições
                <input name="repetitions" defaultValue={entry.repetitions ?? ""} />
              </label>
              <label>
                Carga
                <input name="load" defaultValue={entry.load ?? ""} />
              </label>
              <label>
                Descanso
                <input
                  name="restSeconds"
                  type="number"
                  defaultValue={entry.rest_seconds ?? ""}
                />
              </label>
              <label>
                Duração
                <input
                  name="durationSeconds"
                  type="number"
                  defaultValue={entry.duration_seconds ?? ""}
                />
              </label>
              <label>
                Observações
                <input name="notes" defaultValue={entry.notes ?? ""} />
              </label>
              <button className="button button-primary">Salvar configuração</button>
            </form>

            <form action={moveWorkoutExercise.bind(null, workoutId, entry.id, -1)}>
              <button disabled={index === 0}>↑</button>
            </form>
            <form action={moveWorkoutExercise.bind(null, workoutId, entry.id, 1)}>
              <button disabled={index === composition.length - 1}>↓</button>
            </form>
            <form action={removeWorkoutExercise.bind(null, workoutId, entry.id)}>
              <button>Remover</button>
            </form>
          </article>
        ))}

        <form action={addWorkoutExercise.bind(null, workoutId)} className="crm-filters">
          <label>
            Exercício
            <select name="exerciseId" required>
              <option value="">Selecione</option>
              {exercises.map((exercise: { id: string; name?: string | null }) => (
                <option key={exercise.id} value={exercise.id}>
                  {exercise.name ?? "Exercício"}
                </option>
              ))}
            </select>
          </label>
          <button className="button button-primary">Adicionar exercício</button>
        </form>
      </section>

      <section className="crm-table-panel">
        <h3>Atribuições</h3>

        {(assignments as AssignmentEntry[]).map((assignment) => {
          const assignedClientName = clientName(assignment.client);

          return (
            <article className="card content-list-row" key={assignment.id}>
              <span>
                {assignedClientName} · {assignment.starts_on} — {assignment.ends_on ?? "sem fim"}
              </span>

              <details>
                <summary>Editar</summary>
                <form
                  action={updateAssignment.bind(null, workoutId, assignment.id)}
                  className="crm-filters"
                >
                  <label>
                    Cliente
                    <select name="clientId" defaultValue={assignment.client_id} required>
                      {(clients as AdminWorkoutClient[]).map((client) => (
                        <option key={client.id} value={client.id}>
                          {client.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Início
                    <input
                      name="startsOn"
                      type="date"
                      defaultValue={assignment.starts_on}
                      required
                    />
                  </label>
                  <label>
                    Fim
                    <input
                      name="endsOn"
                      type="date"
                      defaultValue={assignment.ends_on ?? ""}
                    />
                  </label>
                  <label className="crm-create-confirm">
                    <input name="isActive" type="checkbox" defaultChecked={assignment.is_active} />
                    Atribuição ativa
                  </label>

                  {days.map((day, weekday) => {
                    const value = assignment.schedule?.find(
                      (entry) => entry.weekday === weekday,
                    )?.schedule_kind;

                    return (
                      <label key={day}>
                        {day}
                        <select name={`day-${weekday}`} defaultValue={value ?? "OFF"}>
                          <option value="OFF">Sem treino</option>
                          <option value="WORKOUT">Treino</option>
                          <option value="REST">Descanso</option>
                        </select>
                      </label>
                    );
                  })}

                  <button className="button button-primary">Salvar alterações</button>
                </form>
              </details>

              <form
                action={toggleAssignment.bind(
                  null,
                  workoutId,
                  assignment.id,
                  !assignment.is_active,
                )}
              >
                <button>{assignment.is_active ? "Desativar" : "Ativar"}</button>
              </form>
              <form action={cancelAssignment.bind(null, workoutId, assignment.id)}>
                <button>Cancelar</button>
              </form>
            </article>
          );
        })}

        <form action={assignWorkout.bind(null, workoutId)} className="crm-filters">
          <label>
            Cliente
            <select name="clientId" required>
              <option value="">Selecione</option>
              {(clients as AdminWorkoutClient[]).map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Início
            <input name="startsOn" type="date" required />
          </label>
          <label>
            Fim
            <input name="endsOn" type="date" />
          </label>
          {days.map((day, weekday) => (
            <label key={day}>
              {day}
              <select name={`day-${weekday}`}>
                <option value="OFF">Sem treino</option>
                <option value="WORKOUT">Treino</option>
                <option value="REST">Descanso</option>
              </select>
            </label>
          ))}
          <button className="button button-primary">Atribuir</button>
        </form>
      </section>
    </div>
  );
}
