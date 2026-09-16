import Link from "next/link";
import { PageHeader, Card, Avatar } from "@/components/ui";
import { LogoutButton } from "@/components/auth/logout-button";
import { AppIcon, type IconName } from "@/components/icons";
import { createSupabaseServerClient } from "@/lib/supabase/server";
const menu: { label: string; icon: IconName }[] = [{ label: "Meus dados", icon: "profile" }, { label: "Meus treinos", icon: "workout" }, { label: "Minhas conquistas", icon: "achievement" }, { label: "Notificações", icon: "bell" }, { label: "Falar com a Erlany", icon: "chat" }, { label: "Central de ajuda", icon: "help" }, { label: "Configurações", icon: "settings" }];
export default async function MorePage() {
  const client = await createSupabaseServerClient();
  const { data: { user } } = client ? await client.auth.getUser() : { data: { user: null } };
  const isAdmin = user?.app_metadata?.role === "ADMIN";
  return <div><PageHeader title="Mais" /><Card className="profile-summary"><Avatar>JS</Avatar><div><strong>Juliana Silva</strong><small>Ver meu perfil</small></div></Card><div className="category-list more-list">{menu.map((item) => <Card className="category-row" key={item.label}><span className="tip-icon"><AppIcon name={item.icon} /></span><strong>{item.label}</strong><AppIcon name="arrow-right" className="row-arrow" size={19} /></Card>)}{isAdmin && <Link className="admin-access-card" href="/admin"><span className="tip-icon"><AppIcon name="settings" /></span><span><strong>Painel Admin</strong><small>Gestão administrativa</small></span><AppIcon name="arrow-right" className="row-arrow" size={19} /></Link>}<LogoutButton /></div></div>;
}
