"use client";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
export function RetryContent() {
  const router = useRouter(); const [pending, startTransition] = useTransition();
  return <button className="button button-outline" type="button" disabled={pending} onClick={() => startTransition(() => router.refresh())}>{pending ? "Carregando…" : "Tentar novamente"}</button>;
}
