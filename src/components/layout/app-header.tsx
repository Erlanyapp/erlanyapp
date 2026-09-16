"use client";

import Link from "next/link";
import { Avatar, IconButton } from "../ui";
import { AppIcon } from "../icons";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import type { User } from "@supabase/supabase-js";

export function AppHeader() {
  const pathname = usePathname();
  const [name, setName] = useState("você");
  const [initials, setInitials] = useState("EF");
  useEffect(() => {
    const client = createSupabaseBrowserClient();
    if (!client) return;
    void client.auth.getUser().then(({ data }: { data: { user: User | null } }) => {
      const fullName = typeof data.user?.user_metadata?.full_name === "string" ? data.user.user_metadata.full_name.trim() : "";
      const nextName = fullName || data.user?.email?.split("@")[0] || "você";
      setName(nextName);
      setInitials(nextName.split(/\s+/).slice(0, 2).map((part: string) => part[0]).join("").toUpperCase() || "EF");
    });
  }, []);
  if (pathname !== "/app/inicio") return null;
  return <header className="app-header"><div className="home-greeting"><Avatar>{initials}</Avatar><div><p>Olá, {name}!</p><small>Disciplina hoje,<br />resultados amanhã!</small></div></div><div className="header-actions"><IconButton className="icon-button" aria-label="Notificações"><AppIcon name="bell" size={22} /></IconButton><Link href="/app/mais" className="avatar-link"><Avatar>{initials}</Avatar></Link></div></header>;
}
