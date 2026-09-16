import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { BrandLogo } from "@/components/branding/brand-logo";
import { AppIcon } from "@/components/icons";

export async function AdminShell({ children }: { children: React.ReactNode }) {
  async function signOut() {
    "use server";
    const client = await createSupabaseServerClient();
    await client?.auth.signOut();
    redirect("/login");
  }
  return <div className="admin-viewport"><aside className="admin-sidebar"><BrandLogo variant="gold" /><p className="admin-overline">PAINEL ADMINISTRATIVO</p><nav aria-label="Navegação administrativa"><Link href="/admin"><AppIcon name="progress" size={19} /><span>Dashboard</span></Link><Link href="/admin/clientes"><AppIcon name="profile" size={19} /><span>Clientes</span></Link></nav><form action={signOut} className="admin-logout"><button type="submit"><AppIcon name="logout" size={17} /><span>Sair da conta</span></button></form></aside><div className="admin-frame"><header className="admin-header"><div><p className="admin-overline">ERLANY FIT</p><h1>Gestão do aplicativo</h1></div><div className="admin-user"><span>AD</span><small>Administrador</small></div></header><main className="admin-main">{children}</main></div></div>;
}
