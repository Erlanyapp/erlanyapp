"use client";

import Link from "next/link";
import { useActionState, useState } from "react";

import { saveWorkout, type WorkoutActionState } from "@/app/(admin)/admin/treinos/actions";

type Client = {
  id: string;
  name: string;
  email?: string | null;
  avatarUrl?: string | null;
};

type WorkoutValues = {
  name: string;
  description: string;
  category: string;
  level: string;
  durationMinutes: string;
  scope: "GLOBAL" | "CLIENT";
  clientId: string;
  status: "draft" | "published";
  isActive: boolean;
};

const initialState: WorkoutActionState = {};

const valuesFor = (item?: Record<string, unknown>): WorkoutValues => ({
  name: String(item?.name ?? ""),
  description: String(item?.description ?? ""),
  category: String(item?.category ?? ""),
  level: String(item?.level ?? ""),
  durationMinutes: item?.duration_minutes == null ? "" : String(item.duration_minutes),
  scope: item?.scope === "CLIENT" ? "CLIENT" : "GLOBAL",
  clientId: String(item?.client_id ?? ""),
  status: item?.status === "published" ? "published" : "draft",
  isActive: item?.is_active !== false,
});

export function WorkoutEditor({ clients, item }: { clients: Client[]; item?: Record<string, unknown> }) {
  const [values, setValues] = useState(() => valuesFor(item));
  const [state, action, pending] = useActionState(
    saveWorkout.bind(null, (item?.id as string | undefined) ?? null),
    initialState,
  );

  const update = <Key extends keyof WorkoutValues>(key: Key, value: WorkoutValues[Key]) => {
    setValues((current) => ({ ...current, [key]: value }));
  };

  return (
    <form action={action} className="crm-profile-form">
      <h3>{item ? "Editar treino" : "Novo treino"}</h3>

      {state.error ? <p className="crm-form-error" role="alert">{state.error}</p> : null}

      <label>
        Nome
        <input name="name" required minLength={2} maxLength={120} value={values.name} onChange={(event) => update("name", event.target.value)} />
      </label>
      <label>
        Descrição
        <textarea name="description" maxLength={4000} value={values.description} onChange={(event) => update("description", event.target.value)} />
      </label>
      <label>
        Objetivo / categoria
        <input name="category" maxLength={100} value={values.category} onChange={(event) => update("category", event.target.value)} />
      </label>
      <label>
        Nível
        <select name="level" value={values.level} onChange={(event) => update("level", event.target.value)}>
          <option value="">Selecione</option>
          <option>Iniciante</option>
          <option>Intermediário</option>
          <option>Avançado</option>
        </select>
      </label>
      <label>
        Duração (minutos)
        <input name="durationMinutes" type="number" min="1" max="600" value={values.durationMinutes} onChange={(event) => update("durationMinutes", event.target.value)} />
      </label>
      <label>
        Escopo
        <select name="scope" value={values.scope} onChange={(event) => update("scope", event.target.value === "CLIENT" ? "CLIENT" : "GLOBAL")}>
          <option value="GLOBAL">Global</option>
          <option value="CLIENT">Cliente</option>
        </select>
      </label>
      <label>
        Cliente (somente CLIENT)
        <select name="clientId" value={values.clientId} disabled={values.scope !== "CLIENT"} required={values.scope === "CLIENT"} onChange={(event) => update("clientId", event.target.value)}>
          <option value="">Selecione</option>
          {clients.map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}
        </select>
      </label>
      <label>
        Status
        <select name="status" value={values.status} onChange={(event) => update("status", event.target.value === "published" ? "published" : "draft")}>
          <option value="draft">Rascunho</option>
          <option value="published">Publicado</option>
        </select>
      </label>
      <label className="crm-create-confirm">
        <input name="isActive" type="checkbox" checked={values.isActive} onChange={(event) => update("isActive", event.target.checked)} />
        Treino ativo
      </label>
      <button className="button button-primary" disabled={pending}>
        {pending ? "Salvando…" : "Salvar treino"}
      </button>
      <Link href={item ? `/admin/treinos/${item.id}` : "/admin/treinos"} className="button button-outline">Cancelar</Link>
    </form>
  );
}
