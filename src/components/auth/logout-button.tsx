"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { logoutClient } from "@/services/logout-service";
import { AppIcon } from "@/components/icons";

export function LogoutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  return <div><button className="category-row logout-row" disabled={busy} onClick={async () => {
    setBusy(true); setError(null);
    try { await logoutClient(); router.replace("/login"); router.refresh(); }
    catch { setError("Não foi possível sair. Tente novamente."); setBusy(false); }
  }} type="button"><span className="tip-icon"><AppIcon name="logout" /></span><strong>{busy ? "Saindo..." : "Sair"}</strong><AppIcon name="arrow-right" className="row-arrow" size={19} /></button>{error && <p role="alert">{error}</p>}</div>;
}
