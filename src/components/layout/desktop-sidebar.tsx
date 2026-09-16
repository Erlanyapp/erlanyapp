"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AppIcon } from "@/components/icons";
import { LogoutButton } from "@/components/auth/logout-button";
import { desktopPrimaryNavigation, desktopAccountNavigation, desktopNavigationActive } from "@/config/client-desktop-navigation";

export function DesktopSidebar() {
  const pathname = usePathname();
  const links = (items: typeof desktopPrimaryNavigation) => items.map(item => {
    const active = desktopNavigationActive(pathname, item.href);
    return <Link href={item.href} key={item.href} className={active ? "active" : undefined} aria-current={active ? "page" : undefined}>
      <AppIcon name={item.icon} size={20} /><span>{item.label}</span>
    </Link>;
  });
  return <aside className="desktop-sidebar client-desktop-only" aria-label="Área de navegação desktop">
    <Link href="/app/inicio" className="desktop-brand" aria-label="ERLANY FIT — Início"><Image src="/assets/branding/erlany-fit-logo.png" alt="ERLANY FIT" width={140} height={140} sizes="140px" /></Link>
    <nav className="desktop-primary-nav" aria-label="Navegação principal desktop">{links(desktopPrimaryNavigation)}</nav>
    <div className="desktop-account-area"><p>Sua conta</p><nav aria-label="Conta e suporte">{links(desktopAccountNavigation)}</nav><div className="desktop-logout"><LogoutButton /></div></div>
  </aside>;
}
