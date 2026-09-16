"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AppIcon, type IconName } from "@/components/icons";

const items: { href: string; label: string; icon: IconName }[] = [{ href: "/app/inicio", label: "Início", icon: "home" }, { href: "/app/treinos", label: "Treinos", icon: "workout" }, { href: "/app/evolucao", label: "Evolução", icon: "progress" }, { href: "/app/dicas", label: "Dicas", icon: "tips" }, { href: "/app/mais", label: "Mais", icon: "more" }];

export function BottomNavigation() {
  const pathname = usePathname();
  const moreRoutes = ["/app/perfil", "/app/conquistas", "/app/notificacoes", "/app/contato", "/app/ajuda", "/app/configuracoes", "/app/planos"];
  return <nav className="bottom-navigation" aria-label="Navegação principal">{items.map(item => {
    const active = pathname.startsWith(item.href) || (item.href === "/app/treinos" && pathname.startsWith("/app/exercicios/")) || (item.href === "/app/mais" && moreRoutes.some(route => pathname.startsWith(route)));
    return <Link className={active ? "active" : ""} aria-current={active ? "page" : undefined} href={item.href} key={item.href}><span className="nav-icon"><AppIcon name={item.icon} /></span><small>{item.label}</small></Link>;
  })}</nav>;
}
