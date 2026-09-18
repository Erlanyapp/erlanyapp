"use client";

import { FormEvent, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import {
  addWorkoutExercise,
  assignWorkout,
  cancelAssignment,
  moveWorkoutExercise,
  removeWorkoutExercise,
  toggleAssignment,
  updateAssignment,
  updateWorkoutExercise,
} from "@/app/(admin)/admin/treinos/actions";
import type { AdminWorkoutClient } from "@/repositories/admin-workout-repository";

const weekdays = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

export type WorkoutExerciseEntry = {
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

export type WorkoutAssignmentEntry = {
  id: string;
  client_id: string;
  starts_on: string;
  ends_on?: string | null;
  is_active: boolean;
  client?: {
    profile?: { full_name?: string | null } | { full_name?: string | null }[] | null;
  } | null;
  schedule?: { weekday: number; schedule_kind: "WORKOUT" | "REST" }[] | null;
};

type ExerciseOption = { id: string; name?: string | null };
type AssignmentModal = "new" | WorkoutAssignmentEntry | null;

const clientName = (assignment: WorkoutAssignmentEntry) => {
  const profile = assignment.client?.profile;
  const name = Array.isArray(profile) ? profile[0]?.full_name : profile?.full_name;
  return name?.trim() || "Cliente sem nome";
};

const summary = (entry: WorkoutExerciseEntry) =>
  [
    entry.sets ? `${entry.sets} ${entry.sets === 1 ? "série" : "séries"}` : null,
    entry.repetitions ? `${entry.repetitions} repetições` : null,
    entry.load,
    entry.rest_seconds ? `${entry.rest_seconds}s descanso` : null,
    entry.duration_seconds ? `${entry.duration_seconds}s duração` : null,
  ]
    .filter(Boolean)
    .join(" · ") || "Configuração pendente";

const agenda = (assignment: WorkoutAssignmentEntry) =>
  (assignment.schedule ?? [])
    .map((item) => `${weekdays[item.weekday]}${item.schedule_kind === "REST" ? " · descanso" : ""}`)
    .join(", ") || "Sem treino configurado";

const formatDate = (value?: string | null) =>
  value
    ? new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" }).format(
        new Date(`${value}T00:00:00Z`),
      )
    : "Sem fim";

function AssignmentForm({
  workoutId,
  clients,
  value,
  onClose,
  onSaved,
}: {
  workoutId: string;
  clients: AdminWorkoutClient[];
  value: Exclude<AssignmentModal, null>;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const assignment = value === "new" ? null : value;
  const schedule = assignment?.schedule ?? [];

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setError("");
    startTransition(async () => {
      try {
        if (assignment) {
          await updateAssignment(workoutId, assignment.id, form);
        } else {
          await assignWorkout(workoutId, form);
        }
        onSaved();
      } catch (reason) {
        setError(reason instanceof Error ? reason.message : "Não foi possível salvar a atribuição.");
      }
    });
  };

  return (
    <div className="workout-modal-backdrop" role="presentation">
      <section className="workout-modal" role="dialog" aria-modal="true" aria-labelledby="assignment-modal-title">
        <header>
          <div>
            <p className="admin-overline">ATRIBUIÇÃO DE TREINO</p>
            <h3 id="assignment-modal-title">{assignment ? "Editar atribuição" : "Atribuir treino"}</h3>
            <p>{assignment ? "Atualize o cliente, período, agenda ou status." : "Defina quem receberá este treino e quando."}</p>
          </div>
          <button type="button" className="workout-icon-button" aria-label="Fechar" onClick={onClose}>×</button>
        </header>
        <form onSubmit={submit} className="workout-assignment-form">
          {error ? <p className="crm-form-error" role="alert">{error}</p> : null}
          <label>
            Cliente
            <select name="clientId" defaultValue={assignment?.client_id ?? ""} required>
              <option value="">Selecione um cliente</option>
              {clients.map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}
            </select>
          </label>
          <div className="workout-form-grid">
            <label>Início<input name="startsOn" type="date" defaultValue={assignment?.starts_on ?? ""} required /></label>
            <label>Fim<input name="endsOn" type="date" defaultValue={assignment?.ends_on ?? ""} /></label>
          </div>
          <fieldset>
            <legend>Agenda semanal</legend>
            <p>Selecione treino, descanso ou sem treino para cada dia.</p>
            <div className="workout-week-grid">
              {weekdays.map((day, weekday) => {
                const selected = schedule.find((item) => item.weekday === weekday)?.schedule_kind ?? "OFF";
                return <label key={day}>{day}<select name={`day-${weekday}`} defaultValue={selected}><option value="OFF">Sem treino</option><option value="WORKOUT">Treino</option><option value="REST">Descanso</option></select></label>;
              })}
            </div>
          </fieldset>
          <label className="workout-checkbox"><input name="isActive" type="checkbox" defaultChecked={assignment?.is_active ?? true} /> Atribuição ativa</label>
          <footer>
            <button type="button" className="button button-outline" onClick={onClose}>Cancelar</button>
            <button className="button button-primary" disabled={pending}>{pending ? "Salvando…" : assignment ? "Salvar alterações" : "Atribuir treino"}</button>
          </footer>
        </form>
      </section>
    </div>
  );
}

export function WorkoutWorkspace({
  workoutId,
  composition,
  exercises,
  assignments,
  clients,
}: {
  workoutId: string;
  composition: WorkoutExerciseEntry[];
  exercises: ExerciseOption[];
  assignments: WorkoutAssignmentEntry[];
  clients: AdminWorkoutClient[];
}) {
  const router = useRouter();
  const [openExercise, setOpenExercise] = useState<string | null>(null);
  const [modal, setModal] = useState<AssignmentModal>(null);
  const [feedback, setFeedback] = useState("");
  const [pending, startTransition] = useTransition();

  const run = (operation: () => Promise<void>, message: string, onSuccess?: () => void) => {
    setFeedback("");
    startTransition(async () => {
      try {
        await operation();
        setFeedback(message);
        onSuccess?.();
        router.refresh();
      } catch (reason) {
        setFeedback(reason instanceof Error ? reason.message : "Não foi possível concluir a ação.");
      }
    });
  };

  const saveExercise = (entry: WorkoutExerciseEntry, event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    run(
      async () => updateWorkoutExercise(workoutId, entry.id, form),
      "Configuração salva.",
      () => setOpenExercise(null),
    );
  };

  const addExercise = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const formElement = event.currentTarget;
    run(
      async () => addWorkoutExercise(workoutId, form),
      "Exercício adicionado ao treino.",
      () => formElement.reset(),
    );
  };

  return (
    <>
      {feedback ? <p className="workout-feedback" role="status">{feedback}</p> : null}
      <section className="workout-section" aria-labelledby="workout-exercises-title">
        <header className="workout-section-heading">
          <div>
            <p className="admin-overline">COMPOSIÇÃO</p>
            <h3 id="workout-exercises-title">Exercícios do treino</h3>
            <p>Organize os exercícios e configure séries, repetições e cargas.</p>
          </div>
          <span className="workout-count">{composition.length} {composition.length === 1 ? "exercício" : "exercícios"}</span>
        </header>
        <div className="workout-exercise-list">
          {composition.map((entry, index) => (
            <article className="workout-exercise-card" key={entry.id}>
              <div className="workout-order">{String(index + 1).padStart(2, "0")}</div>
              <div className="workout-exercise-copy">
                <h4>{entry.exercise?.name ?? "Exercício"}</h4>
                <p>{summary(entry)}</p>
                {entry.notes ? <small>{entry.notes}</small> : null}
              </div>
              <div className="workout-card-actions">
                <button type="button" className="button button-outline" onClick={() => setOpenExercise(openExercise === entry.id ? null : entry.id)}>Editar configuração</button>
                <button type="button" className="workout-icon-button" aria-label="Subir exercício" disabled={index === 0 || pending} onClick={() => run(async () => moveWorkoutExercise(workoutId, entry.id, -1), "Ordem atualizada.")}>↑</button>
                <button type="button" className="workout-icon-button" aria-label="Descer exercício" disabled={index === composition.length - 1 || pending} onClick={() => run(async () => moveWorkoutExercise(workoutId, entry.id, 1), "Ordem atualizada.")}>↓</button>
                <button type="button" className="workout-danger-link" disabled={pending} onClick={() => run(async () => removeWorkoutExercise(workoutId, entry.id), "Exercício removido.")}>Remover</button>
              </div>
              {openExercise === entry.id ? (
                <form className="workout-config-panel" onSubmit={(event) => saveExercise(entry, event)}>
                  <input name="exerciseId" type="hidden" value={entry.exercise_id} />
                  <label>Séries<input name="sets" type="number" min="1" defaultValue={entry.sets ?? ""} /></label>
                  <label>Repetições<input name="repetitions" defaultValue={entry.repetitions ?? ""} /></label>
                  <label>Carga<input name="load" defaultValue={entry.load ?? ""} /></label>
                  <label>Descanso (seg.)<input name="restSeconds" type="number" min="1" defaultValue={entry.rest_seconds ?? ""} /></label>
                  <label>Duração (seg.)<input name="durationSeconds" type="number" min="1" defaultValue={entry.duration_seconds ?? ""} /></label>
                  <label className="workout-notes">Observações<textarea name="notes" defaultValue={entry.notes ?? ""} /></label>
                  <footer><button type="button" className="button button-outline" onClick={() => setOpenExercise(null)}>Cancelar</button><button className="button button-primary" disabled={pending}>{pending ? "Salvando…" : "Salvar configuração"}</button></footer>
                </form>
              ) : null}
            </article>
          ))}
        </div>
        <form className="workout-add-exercise" onSubmit={addExercise}>
          <div><h4>Adicionar exercício</h4><p>Selecione um exercício da biblioteca para incluí-lo no treino.</p></div>
          <select name="exerciseId" aria-label="Buscar exercício" required><option value="">Buscar exercício…</option>{exercises.map((exercise) => <option key={exercise.id} value={exercise.id}>{exercise.name ?? "Exercício"}</option>)}</select>
          <button className="button button-primary" disabled={pending}>+ Adicionar</button>
        </form>
      </section>
      <section className="workout-section" aria-labelledby="workout-assignments-title">
        <header className="workout-section-heading">
          <div><p className="admin-overline">DISTRIBUIÇÃO</p><h3 id="workout-assignments-title">Atribuições</h3><p>Clientes que receberam este treino.</p></div>
          <div className="workout-section-actions"><span className="workout-count">{assignments.length} {assignments.length === 1 ? "cliente atribuído" : "clientes atribuídos"}</span><button className="button button-primary" onClick={() => setModal("new")}>+ Atribuir treino</button></div>
        </header>
        {assignments.length ? (
          <>
            <div className="workout-assignment-table">
              <div className="workout-assignment-table-head"><span>Cliente</span><span>Período</span><span>Agenda</span><span>Status</span><span>Ações</span></div>
              {assignments.map((assignment) => (
                <div className="workout-assignment-row" key={assignment.id}>
                  <strong>{clientName(assignment)}</strong>
                  <span>{formatDate(assignment.starts_on)} → {formatDate(assignment.ends_on)}</span>
                  <span>{agenda(assignment)}</span>
                  <span className={`workout-status ${assignment.is_active ? "active" : "inactive"}`}>{assignment.is_active ? "● Ativo" : "● Inativo"}</span>
                  <div className="workout-row-actions">
                    <button type="button" className="button button-outline" onClick={() => setModal(assignment)}>Editar</button>
                    <button type="button" className="workout-secondary-link" disabled={pending} onClick={() => run(async () => toggleAssignment(workoutId, assignment.id, !assignment.is_active), assignment.is_active ? "Atribuição desativada." : "Atribuição ativada.")}>{assignment.is_active ? "Desativar" : "Ativar"}</button>
                    <button type="button" className="workout-danger-link" disabled={pending} onClick={() => run(async () => cancelAssignment(workoutId, assignment.id), "Atribuição cancelada.")}>Cancelar</button>
                  </div>
                </div>
              ))}
            </div>
            <div className="workout-assignment-cards">
              {assignments.map((assignment) => (
                <article className="workout-assignment-card" key={assignment.id}>
                  <header><strong>{clientName(assignment)}</strong><span className={`workout-status ${assignment.is_active ? "active" : "inactive"}`}>{assignment.is_active ? "● Ativo" : "● Inativo"}</span></header>
                  <p>{formatDate(assignment.starts_on)} → {formatDate(assignment.ends_on)}</p>
                  <small>Agenda: {agenda(assignment)}</small>
                  <footer><button type="button" className="button button-outline" onClick={() => setModal(assignment)}>Editar</button><button type="button" className="workout-secondary-link" onClick={() => run(async () => toggleAssignment(workoutId, assignment.id, !assignment.is_active), assignment.is_active ? "Atribuição desativada." : "Atribuição ativada.")}>{assignment.is_active ? "Desativar" : "Ativar"}</button></footer>
                </article>
              ))}
            </div>
          </>
        ) : <div className="workout-empty"><strong>Nenhum cliente atribuído</strong><p>Use “Atribuir treino” para definir clientes, período e agenda.</p></div>}
      </section>
      {modal ? <AssignmentForm workoutId={workoutId} clients={clients} value={modal} onClose={() => setModal(null)} onSaved={() => { setModal(null); setFeedback("Atribuição salva."); router.refresh(); }} /> : null}
    </>
  );
}
