"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AppIcon, type IconName } from "@/components/icons";

const items: { href: string; label: string; icon: IconName }[] = [{ href: "/app/inicio", label: "Início", icon: "home" }, { href: "/app/treinos", label: "Treinos", icon: "workout" }, { href: "/app/evolucao", label: "Evolução", icon: "progress" }, { href: "/app/dicas", label: "Dicas", icon: "tips" }, { href: "/app/mais", label: "Mais", icon: "more" }];

export function BottomNavigation() {
  const pathname = usePathname();
  return <nav className="bottom-navigation" aria-label="Navegação principal">{items.map((item) => <Link className={pathname.startsWith(item.href) ? "active" : ""} href={item.href} key={item.href}><span className="nav-icon"><AppIcon name={item.icon} /></span><small>{item.label}</small></Link>)}</nav>;
}
