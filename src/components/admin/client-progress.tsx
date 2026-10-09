"use client";

import Image from "next/image";
import { startTransition, useActionState, useEffect, useState } from "react";
import type { FormEvent } from "react";
import { deletePerformanceRecord, deleteProgressAssessment, deleteProgressMeasurement, deleteProgressPhoto, replaceProgressPhoto, savePerformanceRecord, saveProgressAssessment, saveProgressMeasurement, uploadProgressPhoto, type AdminActionState } from "@/app/(admin)/admin/clientes/actions";
import type { AdminPerformanceRecord, AdminProgressAssessment, AdminProgressData, AdminProgressMeasurement, AdminProgressPhoto } from "@/types/admin-progress";

const today = () => new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date());
const date = (value: string) => new Date(`${value}T12:00:00`).toLocaleDateString("pt-BR");
const value = (measurements: Record<string, string>, label: string) => measurements[label]?.replace(/\s*cm$/i, "") ?? "";
const feedback = (state: AdminActionState) => state.error ? <p className="crm-form-error" role="alert">{state.error}</p> : state.success ? <p className="crm-feedback" role="status">{state.success}</p> : null;
// Dispatch manually so React does not reset uncontrolled inputs on an error result.
const submitProgress = (action: (form: FormData) => void) => (event: FormEvent<HTMLFormElement>) => {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  startTransition(() => action(form));
};

function AssessmentForm({ clientId, item }: { clientId: string; item?: AdminProgressAssessment }) {
  const [state, action, pending] = useActionState(saveProgressAssessment.bind(null, clientId, item?.id ?? null), {} as AdminActionState);
  return <form onSubmit={submitProgress(action)} className="crm-progress-form">
    <label>Data da avaliação<input name="assessedAt" type="date" required defaultValue={item?.assessedAt ?? today()} /></label>
    <label>Observações<textarea name="notes" maxLength={4000} defaultValue={item?.notes ?? ""} placeholder="Orientações, contexto e próximos passos." /></label>
    <div className="crm-progress-actions"><button className="button button-primary" disabled={pending}>{pending ? "Salvando…" : item ? "Salvar avaliação" : "Criar avaliação"}</button>{feedback(state)}</div>
  </form>;
}

type ProgressDeleteAction = (clientId: string, id: string, state: AdminActionState, form: FormData) => Promise<AdminActionState>;

function DeleteProgressRecord({ clientId, id, action: deleteAction, label, title, description }: { clientId: string; id: string; action: ProgressDeleteAction; label: string; title: string; description: string }) {
  const [state, action, pending] = useActionState(deleteAction.bind(null, clientId, id), {} as AdminActionState);
  const [confirming, setConfirming] = useState(false);
  useEffect(() => { if (state.success) setConfirming(false); }, [state.success]);
  return <><button className="button button-outline" type="button" disabled={pending} onClick={() => setConfirming(true)}>{pending ? "Removendo…" : label}</button>{feedback(state)}{confirming ? <div className="workout-modal-backdrop" role="presentation"><section className="workout-modal crm-delete-modal" role="dialog" aria-modal="true" aria-labelledby={`delete-progress-${id}`}><header><div><p className="admin-overline">CONFIRMAR EXCLUSÃO</p><h3 id={`delete-progress-${id}`}>{title}</h3><p>{description}</p></div><button className="workout-icon-button" type="button" aria-label="Fechar" onClick={() => setConfirming(false)} disabled={pending}>×</button></header><form onSubmit={submitProgress(action)} className="workout-assignment-form"><footer><button className="button button-outline" type="button" onClick={() => setConfirming(false)} disabled={pending}>Cancelar</button><button className="button button-primary" type="submit" disabled={pending}>{pending ? "Removendo…" : "Confirmar exclusão"}</button></footer>{feedback(state)}</form></section></div> : null}</>;
}

function DeleteAssessment({ clientId, id }: { clientId: string; id: string }) {
  return <DeleteProgressRecord clientId={clientId} id={id} action={deleteProgressAssessment} label="Remover avaliação" title="Remover esta avaliação?" description="Peso, medidas, fotos e desempenho serão preservados sem vínculo de avaliação." />;
}

function AssessmentSelect({ assessments, value }: { assessments: AdminProgressAssessment[]; value: string | null }) {
  return <label>Avaliação vinculada<select name="assessmentId" defaultValue={value ?? ""}><option value="">Sem vínculo de avaliação</option>{assessments.map(assessment => <option value={assessment.id} key={assessment.id}>{date(assessment.assessedAt)}</option>)}</select></label>;
}

function MeasurementForm({ clientId, assessments, item }: { clientId: string; assessments: AdminProgressAssessment[]; item?: AdminProgressMeasurement }) {
  const [state, action, pending] = useActionState(saveProgressMeasurement.bind(null, clientId, item?.id ?? null), {} as AdminActionState);
  const measurement = item?.measurements ?? {};
  return <form onSubmit={submitProgress(action)} className="crm-progress-form">
    <div className="crm-progress-form-grid"><label>Data<input name="recordedAt" type="date" required defaultValue={item?.recordedAt ?? today()} /></label><AssessmentSelect assessments={assessments} value={item?.assessmentId ?? null} /></div>
    <div className="crm-progress-measures">{[["chest", "Busto"], ["waist", "Cintura"], ["hips", "Quadril"], ["arm", "Braço"], ["thigh", "Coxa"], ["calf", "Panturrilha"]].map(([field, label]) => <label key={field}>{label} (cm)<input name={field} inputMode="decimal" defaultValue={value(measurement, label)} placeholder="—" /></label>)}</div>
    <div className="crm-progress-actions"><button className="button button-primary" disabled={pending}>{pending ? "Salvando…" : item ? "Salvar medidas" : "Registrar medidas"}</button>{feedback(state)}</div>
  </form>;
}

function PerformanceForm({ clientId, assessments, item }: { clientId: string; assessments: AdminProgressAssessment[]; item?: AdminPerformanceRecord }) {
  const [state, action, pending] = useActionState(savePerformanceRecord.bind(null, clientId, item?.id ?? null), {} as AdminActionState);
  return <form onSubmit={submitProgress(action)} className="crm-progress-form">
    <div className="crm-progress-form-grid"><label>Data<input name="recordedAt" type="date" required defaultValue={item?.recordedAt ?? today()} /></label><AssessmentSelect assessments={assessments} value={item?.assessmentId ?? null} /></div>
    <div className="crm-progress-form-grid"><label>Métrica<input name="metric" required minLength={2} maxLength={160} defaultValue={item?.metric ?? ""} placeholder="Ex.: Carga no agachamento" /></label><label>Valor<input name="value" inputMode="decimal" defaultValue={item?.value ?? ""} placeholder="Opcional" /></label><label>Unidade<input name="unit" maxLength={40} defaultValue={item?.unit ?? ""} placeholder="kg, repetições…" /></label></div>
    <div className="crm-progress-actions"><button className="button button-primary" disabled={pending}>{pending ? "Salvando…" : item ? "Salvar desempenho" : "Registrar desempenho"}</button>{feedback(state)}</div>
  </form>;
}

function PhotoForm({ clientId, assessments }: { clientId: string; assessments: AdminProgressAssessment[] }) {
  const [state, action, pending] = useActionState(uploadProgressPhoto.bind(null, clientId), {} as AdminActionState);
  return <form onSubmit={submitProgress(action)} className="crm-progress-form" encType="multipart/form-data">
    <div className="crm-progress-form-grid"><label>Data<input name="recordedAt" type="date" required defaultValue={today()} /></label><AssessmentSelect assessments={assessments} value={null} /><label>Categoria<input name="category" maxLength={100} placeholder="Frente, lateral, costas…" /></label></div>
    <label>Foto privada<input name="photo" type="file" required accept="image/png,image/jpeg,image/webp" /><small>PNG, JPG ou WebP, até 4 MB. A imagem permanece privada.</small></label>
    <div className="crm-progress-actions"><button className="button button-primary" disabled={pending}>{pending ? "Enviando…" : "Adicionar foto"}</button>{feedback(state)}</div>
  </form>;
}

function DeletePhoto({ clientId, id }: { clientId: string; id: string }) {
  return <DeleteProgressRecord clientId={clientId} id={id} action={deleteProgressPhoto} label="Remover foto" title="Remover esta foto?" description="A foto deixará a evolução deste cliente. O arquivo privado será preservado para limpeza segura na biblioteca de mídia." />;
}

function ReplacePhoto({ clientId, item, assessments }: { clientId: string; item: AdminProgressPhoto; assessments: AdminProgressAssessment[] }) {
  const [state, action, pending] = useActionState(replaceProgressPhoto.bind(null, clientId, item.id), {} as AdminActionState);
  return <details className="crm-inline-details"><summary className="button button-secondary">Substituir foto</summary><form onSubmit={submitProgress(action)} className="crm-progress-form" encType="multipart/form-data"><div className="crm-progress-form-grid"><label>Data<input name="recordedAt" type="date" required defaultValue={item.recordedAt} /></label><AssessmentSelect assessments={assessments} value={item.assessmentId} /><label>Categoria<input name="category" maxLength={100} defaultValue={item.category ?? ""} /></label></div><label>Nova foto privada<input name="photo" type="file" required accept="image/png,image/jpeg,image/webp" /></label><div className="crm-progress-actions"><button className="button button-primary" disabled={pending}>{pending ? "Substituindo…" : "Salvar nova foto"}</button>{feedback(state)}</div></form></details>;
}

export function AdminProgressPanel({ clientId, data }: { clientId: string; data: AdminProgressData }) {
  return <section className="crm-progress-panel"><div className="crm-section-heading"><div><h3>Evolução física</h3><p>Avaliações, medidas, fotos e desempenho reais deste cliente.</p></div><details className="crm-inline-details"><summary className="button button-primary">Nova avaliação</summary><AssessmentForm clientId={clientId} /></details></div>
    <div className="crm-progress-summary"><article className="crm-metric"><strong>{data.assessments.length}</strong><span>Avaliações</span></article><article className="crm-metric"><strong>{data.measurements.length}</strong><span>Registros de medidas</span></article><article className="crm-metric"><strong>{data.photos.length}</strong><span>Fotos privadas</span></article><article className="crm-metric"><strong>{data.performance.length}</strong><span>Métricas de desempenho</span></article></div>
    <section className="crm-record-group"><div className="crm-section-heading"><h3>Avaliações</h3><p>{data.assessments.length} registro(s)</p></div>{data.assessments.length ? <div className="crm-progress-list">{data.assessments.map(item => <details className="card crm-progress-record" key={item.id}><summary><span><strong>{date(item.assessedAt)}</strong><small>{item.notes ? "Com observações" : "Sem observações"}</small></span><span>Editar</span></summary><AssessmentForm clientId={clientId} item={item} /><DeleteAssessment clientId={clientId} id={item.id} /></details>)}</div> : <p className="muted">Nenhuma avaliação cadastrada.</p>}</section>
    <section className="crm-record-group"><details className="crm-inline-details"><summary className="button button-secondary">Registrar medidas</summary><MeasurementForm clientId={clientId} assessments={data.assessments} /></details><div className="crm-progress-list">{data.measurements.map(item => <details className="card crm-progress-record" key={item.id}><summary><span><strong>Medidas · {date(item.recordedAt)}</strong><small>{Object.keys(item.measurements).length} medida(s)</small></span><span>Editar</span></summary><MeasurementForm clientId={clientId} assessments={data.assessments} item={item} /><DeleteProgressRecord clientId={clientId} id={item.id} action={deleteProgressMeasurement} label="Remover medidas" title="Remover este registro de medidas?" description="Esta ação remove somente este registro corporal deste cliente." /></details>)}</div></section>
    <section className="crm-record-group"><details className="crm-inline-details"><summary className="button button-secondary">Registrar desempenho</summary><PerformanceForm clientId={clientId} assessments={data.assessments} /></details><div className="crm-progress-list">{data.performance.map(item => <details className="card crm-progress-record" key={item.id}><summary><span><strong>{item.metric}</strong><small>{date(item.recordedAt)} · {item.value == null ? "—" : `${item.value}${item.unit ? ` ${item.unit}` : ""}`}</small></span><span>Editar</span></summary><PerformanceForm clientId={clientId} assessments={data.assessments} item={item} /><DeleteProgressRecord clientId={clientId} id={item.id} action={deletePerformanceRecord} label="Remover desempenho" title="Remover este registro de desempenho?" description="Esta ação remove somente esta métrica deste cliente." /></details>)}</div></section>
    <section className="crm-record-group"><details className="crm-inline-details"><summary className="button button-secondary">Adicionar foto</summary><PhotoForm clientId={clientId} assessments={data.assessments} /></details>{data.photos.length ? <div className="crm-progress-photos">{data.photos.map(item => <article className="card crm-progress-photo" key={item.id}>{item.imageUrl ? <Image src={item.imageUrl} alt={item.category ?? "Foto de evolução"} width={480} height={640} unoptimized /> : <p role="alert">A foto existe, mas não foi possível obter sua URL privada.</p>}<strong>{item.category ?? "Foto de evolução"}</strong><small>{date(item.recordedAt)}</small><ReplacePhoto clientId={clientId} item={item} assessments={data.assessments} /><DeletePhoto clientId={clientId} id={item.id} /></article>)}</div> : <p className="muted">Nenhuma foto privada cadastrada.</p>}</section>
    <section className="crm-record-group"><div className="crm-section-heading"><h3>Histórico de peso</h3><p>{data.weights.length} registro(s)</p></div>{data.weights.length ? <div className="crm-progress-list">{data.weights.map(weight => <article className="card crm-progress-record" key={weight.id}><strong>{weight.value} kg</strong><small>{date(weight.recordedAt)}</small></article>)}</div> : <p className="muted">Nenhum peso registrado.</p>}</section>
  </section>;
}
