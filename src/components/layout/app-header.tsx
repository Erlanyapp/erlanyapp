"use client";

import Link from "next/link";
import { Avatar, IconButton } from "../ui";
import { AppIcon } from "../icons";
import { usePathname } from "next/navigation";

export function AppHeader() {
  const pathname = usePathname();
  if (pathname !== "/app/inicio") return null;
  return <header className="app-header"><div className="home-greeting"><Avatar>JS</Avatar><div><p>Olá, Juliana!</p><small>Disciplina hoje,<br />resultados amanhã!</small></div></div><div className="header-actions"><IconButton className="icon-button" aria-label="Notificações"><AppIcon name="bell" size={22} /></IconButton><Link href="/app/mais" className="avatar-link"><Avatar>JS</Avatar></Link></div></header>;
}
