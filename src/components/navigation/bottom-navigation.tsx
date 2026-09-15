"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [{ href: "/app/inicio", label: "Início", icon: "⌂" }, { href: "/app/treinos", label: "Treinos", icon: "♧" }, { href: "/app/evolucao", label: "Evolução", icon: "⌁" }, { href: "/app/dicas", label: "Dicas", icon: "♡" }, { href: "/app/mais", label: "Mais", icon: "≡" }];

export function BottomNavigation() {
  const pathname = usePathname();
  return <nav className="bottom-navigation" aria-label="Navegação principal">{items.map((item) => <Link className={pathname.startsWith(item.href) ? "active" : ""} href={item.href} key={item.href}><span>{item.icon}</span><small>{item.label}</small></Link>)}</nav>;
}
