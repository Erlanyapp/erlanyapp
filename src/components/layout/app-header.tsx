import Link from "next/link";
import { ProfileAvatar } from "@/components/client/profile-avatar";
import { AppIcon } from "../icons";
import type { Account } from "@/types/account";

export function AppHeader({ account }: { account: Account }) {
  const firstName = account.name.trim().split(/\s+/)[0];
  return <header className="app-header"><div className="home-greeting"><Link href="/app/perfil" aria-label="Ver meu perfil"><ProfileAvatar account={account} /></Link><div><h1>Olá, {firstName}!</h1><p>Disciplina hoje,<br />resultados amanhã!</p></div></div><div className="header-actions"><Link className="icon-button" href="/app/notificacoes" aria-label="Notificações"><AppIcon name="bell" size={25} /></Link></div></header>;
}
