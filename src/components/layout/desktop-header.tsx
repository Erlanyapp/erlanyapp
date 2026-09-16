"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AppIcon } from "@/components/icons";
import { ProfileAvatar } from "@/components/client/profile-avatar";
import { desktopPageContext } from "@/config/client-desktop-navigation";
import type { Account } from "@/types/account";

export function DesktopHeader({ account }: { account: Pick<Account, "name" | "avatarUrl"> }) {
  const pathname = usePathname();
  return <header className="desktop-header client-desktop-only">
    <div className="desktop-page-context"><span>Seu espaço ERLANY FIT</span><p>{desktopPageContext(pathname)}</p></div>
    <div className="desktop-header-actions"><Link href="/app/notificacoes" className="desktop-notifications" aria-label="Notificações desktop"><AppIcon name="bell" size={22} /></Link>
      <Link className="desktop-profile" href="/app/perfil" aria-label="Acessar meu perfil"><span>{account.name}</span><ProfileAvatar account={account} /></Link>
    </div>
  </header>;
}
