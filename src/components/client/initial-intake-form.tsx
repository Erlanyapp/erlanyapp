"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { saveInitialIntake, saveInitialIntakeDraft } from "@/app/(client)/app/actions";

const stepFields = [
  ["birthDate", "heightCm", "currentWeightKg", "targetWeightKg"],
  ["primaryGoal"],
  ["experienceLevel", "trainingDaysPerWeek", "trainingLocation", "sessionMinutes"],
  [],
] as const;

export function InitialIntakeForm({ initial }: { initial: Record<string, unknown> | null }) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const value = (key: string) => String(initial?.[key] ?? "");

  const continueToNextStep = async () => {
    const form = document.getElementById("initial-intake") as HTMLFormElement | null;
    if (!form) return;
    const values = new FormData(form);
    const required = stepFields[step] ?? [];
    if (required.some((key) => !String(values.get(key) ?? ""))) {
      setError("Preencha os campos obrigatórios para continuar.");
      return;
    }

    setBusy(true);
    const result = await saveInitialIntakeDraft(values);
    setBusy(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setError("");
    setStep((current) => Math.min(current + 1, stepFields.length - 1));
  };

  return (
    <form
      id="initial-intake"
      className="account-form card intake-form"
      onSubmit={async (event) => {
        event.preventDefault();
        setBusy(true);
        const result = await saveInitialIntake(new FormData(event.currentTarget));
        setBusy(false);
        if (!result.ok) {
          setError(result.message);
          return;
        }
        router.replace("/app/perfil");
        router.refresh();
      }}
    >
      <p className="eyebrow">FICHA INICIAL · {step + 1}/4</p>
      <div className="intake-progress" aria-label={`Etapa ${step + 1} de 4`}><i style={{ width: `${(step + 1) * 25}%` }} /></div>

      <section hidden={step !== 0} aria-hidden={step !== 0}>
        <h2>Seus dados físicos</h2>
        <label>Nascimento<input name="birthDate" type="date" required defaultValue={value("birth_date")} /></label>
        <label>Altura (cm)<input name="heightCm" type="number" min="80" max="260" required defaultValue={value("height_cm")} /></label>
        <label>Peso atual (kg)<input name="currentWeightKg" type="number" min="20" max="500" step="0.1" required defaultValue={value("current_weight_kg")} /></label>
        <label>Meta de peso (kg)<input name="targetWeightKg" type="number" min="20" max="500" step="0.1" required defaultValue={value("target_weight_kg")} /></label>
      </section>

      <section hidden={step !== 1} aria-hidden={step !== 1}>
        <h2>Seu objetivo</h2>
        <label>Objetivo
          <select name="primaryGoal" required defaultValue={value("primary_goal")}>
            <option value="">Selecione</option><option value="WEIGHT_LOSS">Emagrecer</option><option value="MUSCLE_GAIN">Ganhar massa muscular</option><option value="CONDITIONING">Melhorar condicionamento</option><option value="QUALITY_OF_LIFE">Saúde e qualidade de vida</option>
          </select>
        </label>
      </section>

      <section hidden={step !== 2} aria-hidden={step !== 2}>
        <h2>Sua rotina</h2>
        <label>Nível
          <select name="experienceLevel" required defaultValue={value("experience_level")}>
            <option value="">Selecione</option><option value="BEGINNER">Iniciante</option><option value="INTERMEDIATE">Intermediário</option><option value="ADVANCED">Avançado</option>
          </select>
        </label>
        <label>Dias por semana
          <select name="trainingDaysPerWeek" required defaultValue={value("training_days_per_week")}>
            <option value="">Selecione</option>{[1, 2, 3, 4, 5, 6, 7].map((days) => <option key={days} value={days}>{days} dias</option>)}
          </select>
        </label>
        <label>Local
          <select name="trainingLocation" required defaultValue={value("training_location")}>
            <option value="">Selecione</option><option value="GYM">Academia</option><option value="HOME">Casa</option><option value="BOTH">Ambos</option>
          </select>
        </label>
        <label>Tempo por sessão
          <select name="sessionMinutes" required defaultValue={value("session_minutes")}>
            <option value="">Selecione</option><option value="30">30 minutos</option><option value="45">45 minutos</option><option value="60">60 minutos</option><option value="90">90 minutos</option>
          </select>
        </label>
      </section>

      <section hidden={step !== 3} aria-hidden={step !== 3}>
        <h2>Cuidados e limitações</h2>
        <p className="muted">Não pedimos diagnósticos. Conte apenas o necessário para adaptar seu atendimento.</p>
        <label>Possui limitação?
          <select name="hasLimitations" defaultValue={value("has_limitations") === "true" ? "yes" : "no"}><option value="no">Não</option><option value="yes">Sim</option></select>
        </label>
        <label>Há orientação profissional?
          <select name="hasProfessionalGuidance" defaultValue={value("has_professional_guidance") === "true" ? "yes" : "no"}><option value="no">Não</option><option value="yes">Sim</option></select>
        </label>
        <label>Restrições ou observações<textarea name="restrictions" maxLength={2000} defaultValue={value("restrictions")} /></label>
      </section>

      {error && <p className="form-feedback error" role="alert">{error}</p>}
      <div className="intake-actions">
        {step > 0 && <button type="button" className="button button-outline" disabled={busy} onClick={() => setStep((current) => current - 1)}>Voltar</button>}
        {step < 3 ? <button type="button" className="button button-primary" disabled={busy} onClick={continueToNextStep}>{busy ? "Salvando…" : "Continuar"}</button> : <button className="button button-primary" disabled={busy}>{busy ? "Salvando…" : "Finalizar cadastro"}</button>}
      </div>
    </form>
  );
}
