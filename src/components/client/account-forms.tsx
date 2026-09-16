"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { saveProfile, saveWeight, sendSupportMessage } from "@/app/(client)/app/actions";
import { ProfileAvatar } from "./profile-avatar";
import { MAX_AVATAR_BYTES } from "@/domain/client-account";
import type { Account, ActionResult } from "@/types/account";
function Feedback({ result }: { result: ActionResult | null }) { return result ? <p className={`form-feedback ${result.ok ? "success" : "error"}`} role={result.ok ? "status" : "alert"}>{result.message}</p> : null; }
export function ProfileForm({ account }: { account: Account }) {
  const router = useRouter();
  const [photo, setPhoto] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<ActionResult | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  useEffect(() => { if (!photo) { setPreview(null); return; } const url = URL.createObjectURL(photo); setPreview(url); return () => URL.revokeObjectURL(url); }, [photo]);
  return <form className="account-form card" onSubmit={async event => {
    event.preventDefault(); const form = new FormData(event.currentTarget);
    if (photo) form.set("photo", photo); else form.delete("photo"); setBusy(true); setResult(null);
    try { const response = await saveProfile(form); setResult(response); if (response.ok) { router.refresh(); setPhoto(null); if (fileRef.current) fileRef.current.value = ""; } }
    catch { setResult({ ok: false, message: "Não foi possível salvar. Verifique a conexão e tente novamente." }); }
    finally { setBusy(false); }
  }}><div className="profile-photo-editor"><ProfileAvatar account={account} large preview={preview} /></div>
    <label>Alterar foto<input ref={fileRef} type="file" name="photo" accept="image/png,image/jpeg,image/webp" disabled={busy} onChange={event => {
      const file = event.target.files?.[0] ?? null;
      if (file && (file.size === 0 || file.size > MAX_AVATAR_BYTES || !["image/png", "image/jpeg", "image/webp"].includes(file.type))) { setResult({ ok: false, message: "Escolha PNG, JPEG ou WebP com conteúdo válido, de até 4 MB." }); event.target.value = ""; setPhoto(null); return; }
      setResult(null); setPhoto(file);
    }} /></label><small>Foto privada. PNG, JPEG ou WebP, até 4 MB.</small>
    <label>Nome<input name="name" defaultValue={account.name} minLength={2} maxLength={100} required autoComplete="name" disabled={busy} /></label>
    <label>E-mail<input value={account.email} readOnly type="email" autoComplete="email" /></label><small>Alteração de e-mail não está disponível nesta etapa.</small>
    <Feedback result={result} /><button type="submit" className="button button-primary full-width" disabled={busy}>{busy ? "Salvando…" : "Salvar perfil"}</button><Link className="button button-outline full-width" href="/app/perfil">Voltar ao perfil</Link></form>;
}
export function WeightForm() {
  const router = useRouter(); const [busy, setBusy] = useState(false); const [result, setResult] = useState<ActionResult | null>(null);
  const today = new Date().toISOString().slice(0, 10);
  return <details className="card action-details"><summary>Registrar peso</summary><form className="account-form" onSubmit={async event => {
    event.preventDefault(); const form = new FormData(event.currentTarget); setBusy(true); setResult(null);
    try { const response = await saveWeight(form); setResult(response); if (response.ok) router.refresh(); }
    catch { setResult({ ok: false, message: "Não foi possível registrar o peso. Tente novamente." }); } finally { setBusy(false); }
  }}><label>Peso (kg)<input name="weight" type="number" inputMode="decimal" min="0.01" max="500" step="0.01" required disabled={busy} /></label><label>Data<input name="date" type="date" defaultValue={today} max={today} required disabled={busy} /></label><Feedback result={result} /><button className="button button-primary full-width" disabled={busy} type="submit">{busy ? "Registrando…" : "Salvar peso"}</button></form></details>;
}
export function ContactForm() {
  const router = useRouter(); const [busy, setBusy] = useState(false); const [result, setResult] = useState<ActionResult | null>(null);
  return <form className="account-form card" onSubmit={async event => {
    event.preventDefault(); const element = event.currentTarget; const form = new FormData(element); setBusy(true); setResult(null);
    try { const response = await sendSupportMessage(form); setResult(response); if (response.ok) { element.reset(); router.refresh(); } }
    catch { setResult({ ok: false, message: "Não foi possível enviar. Tente novamente." }); } finally { setBusy(false); }
  }}><label>Mensagem<textarea name="message" required minLength={3} maxLength={2000} rows={5} disabled={busy} /></label><Feedback result={result} /><button className="button button-primary full-width" type="submit" disabled={busy}>{busy ? "Enviando…" : "Enviar mensagem"}</button></form>;
}
