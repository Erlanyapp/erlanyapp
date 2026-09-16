import Link from "next/link";
import { PageHeader } from "@/components/ui";
import { LogoutButton } from "@/components/auth/logout-button";
import { AppIcon, type IconName } from "@/components/icons";
import { ProfileAvatar } from "@/components/client/profile-avatar";
import { getClientAccount } from "@/services/server-account";
const menu: { label: string; icon: IconName; href: string }[] = [
  { label: "Meus dados", icon: "profile", href: "/app/perfil" },
  { label: "Meus treinos", icon: "workout", href: "/app/treinos?tab=Meus+treinos" },
  { label: "Planos", icon: "nutrition", href: "/app/planos" },
  { label: "Minhas conquistas", icon: "achievement", href: "/app/conquistas" },
  { label: "Notificações", icon: "bell", href: "/app/notificacoes" },
  { label: "Falar com a Erlany", icon: "chat", href: "/app/contato" },
  { label: "Central de ajuda", icon: "help", href: "/app/ajuda" },
  { label: "Configurações", icon: "settings", href: "/app/configuracoes" },
];
export default async function MorePage() {
  const { account } = await getClientAccount();
  return <div><PageHeader title="Mais" /><Link className="card profile-summary" href="/app/perfil"><ProfileAvatar account={account} /><div><strong>{account.name}</strong><small>Ver meu perfil</small></div></Link><div className="category-list more-list">{menu.map(item => <Link className="card category-row" href={item.href} key={item.label}><span className="tip-icon"><AppIcon name={item.icon} /></span><strong>{item.label}</strong><AppIcon name="arrow-right" className="row-arrow" size={19} /></Link>)}{account.role === "ADMIN" && <Link className="admin-access-card" href="/admin"><span className="tip-icon"><AppIcon name="settings" /></span><span><strong>Painel Admin</strong><small>Gestão administrativa</small></span><AppIcon name="arrow-right" className="row-arrow" size={19} /></Link>}<LogoutButton /></div></div>;
}
