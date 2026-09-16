"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { adminArea } from "@/config/admin-navigation";
import { ProfileAvatar } from "@/components/client/profile-avatar";
export function AdminHeader({administrator}:{administrator:{name:string;avatarUrl:string|null}}) {
  const path=usePathname(),area=adminArea(path),detail=path.startsWith("/admin/clientes/");
  return <header className="admin-header"><div><nav className="admin-breadcrumb" aria-label="Breadcrumb"><Link href="/admin">ERLANY FIT</Link><span>/</span>{detail?<><Link href="/admin/clientes">Clientes</Link><span>/</span><span>Ficha do cliente</span></>:<span>{area}</span>}</nav><p className="admin-context">{area}</p></div><div className="admin-user"><div><strong>{administrator.name}</strong><small>Administrador</small></div><ProfileAvatar account={administrator}/></div></header>;
}
