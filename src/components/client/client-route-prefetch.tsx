"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export const clientPrefetchRoutes = ["/app/inicio", "/app/treinos", "/app/evolucao", "/app/dicas", "/app/mais"] as const;

// Only route payloads: no exercises, players, photos or signed-image downloads.
// The router owns this session's cache; login/logout already refresh it.
export function ClientRoutePrefetch() {
  const router = useRouter();
  useEffect(() => {
    const prefetch = () => clientPrefetchRoutes.forEach(href => router.prefetch(href));
    if ("requestIdleCallback" in window) {
      const id = window.requestIdleCallback(prefetch, { timeout: 1000 });
      return () => window.cancelIdleCallback(id);
    }
    const id = setTimeout(prefetch, 150);
    return () => clearTimeout(id);
  }, [router]);
  return null;
}
