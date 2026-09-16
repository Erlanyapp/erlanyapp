"use client";

import Link from "next/link";
import { ProfileAvatar } from "@/components/client/profile-avatar";
import { AppIcon } from "../icons";
import { usePathname } from "next/navigation";
import type { Account } from "@/types/account";

export function AppHeader({ account }: { account: Account }) {
  const pathname = usePathname();
  if (pathname !== "/app/inicio") return null;
  return <header className="app-header"><div className="home-greeting"><Link href="/app/perfil" aria-label="Ver meu perfil"><ProfileAvatar account={account} /></Link><div><p>Olá, {account.name}!</p><small>Disciplina hoje,<br />resultados amanhã!</small></div></div><div className="header-actions"><Link className="icon-button" href="/app/notificacoes" aria-label="Notificações"><AppIcon name="bell" size={22} /></Link></div></header>;
}
