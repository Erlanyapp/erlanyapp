import type { IconName } from "@/components/icons";

export const desktopPrimaryNavigation: { href: string; label: string; icon: IconName }[] = [
  { href: "/app/inicio", label: "Início", icon: "home" },
  { href: "/app/treinos", label: "Treinos", icon: "workout" },
  { href: "/app/evolucao", label: "Evolução", icon: "progress" },
  { href: "/app/alimentacao", label: "Alimentação", icon: "nutrition" },
  { href: "/app/dicas", label: "Dicas da Erlany", icon: "tips" },
  { href: "/app/planos", label: "Planos", icon: "crown" },
  { href: "/app/mais", label: "Mais", icon: "more" },
];

export const desktopAccountNavigation: typeof desktopPrimaryNavigation = [
  { href: "/app/perfil", label: "Meu perfil", icon: "profile" },
  { href: "/app/conquistas", label: "Conquistas", icon: "achievement" },
  { href: "/app/configuracoes", label: "Configurações", icon: "settings" },
  { href: "/app/ajuda", label: "Central de ajuda", icon: "help" },
  { href: "/app/contato", label: "Falar com a Erlany", icon: "chat" },
];

const routeMatches = (pathname: string, href: string) => pathname === href || pathname.startsWith(`${href}/`);

export function desktopNavigationActive(pathname: string, href: string) {
  return routeMatches(pathname, href) || (href === "/app/treinos" && (routeMatches(pathname, "/app/exercicios") || pathname === "/app/exercicio"));
}

export function desktopPageContext(pathname: string) {
  if (pathname === "/app/perfil/editar") return "Editar perfil";
  if (pathname.startsWith("/app/exercicios/")) return "Exercício";
  if (pathname === "/app/notificacoes") return "Notificações";
  return [...desktopPrimaryNavigation, ...desktopAccountNavigation].find(item => routeMatches(pathname, item.href))?.label ?? "ERLANY FIT";
}
