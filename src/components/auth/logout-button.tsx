"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { logoutClient } from "@/services/logout-service";

export function LogoutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  return <div><button className="category-row logout-row" disabled={busy} onClick={async () => {
    setBusy(true); setError(null);
    try { await logoutClient(); router.replace("/login"); router.refresh(); }
    catch { setError("Não foi possível sair. Tente novamente."); setBusy(false); }
  }} type="button"><span className="tip-icon" aria-hidden="true">↪</span><strong>{busy ? "Saindo..." : "Sair"}</strong><b aria-hidden="true">›</b></button>{error && <p role="alert">{error}</p>}</div>;
}
