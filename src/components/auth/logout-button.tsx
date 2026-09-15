"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export function LogoutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  return <button className="category-row logout-row" disabled={busy} onClick={async () => { setBusy(true); const { error } = await createSupabaseBrowserClient().auth.signOut(); if (error) console.error("[auth/logout]", error); router.replace("/login"); router.refresh(); }} type="button"><span className="tip-icon">↪</span><strong>{busy ? "Saindo..." : "Sair"}</strong><b>›</b></button>;
}
