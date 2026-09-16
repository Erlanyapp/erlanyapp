"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AppIcon } from "@/components/icons";
import { adminNavigation } from "@/config/admin-navigation";
export function AdminNavigation() {
  const path=usePathname();
  return <nav aria-label="Navegação administrativa">{adminNavigation.map(x=><Link href={x.href} key={x.href} aria-current={(x.href==="/admin"?path===x.href:path===x.href||path.startsWith(x.href+"/"))?"page":undefined}><AppIcon name={x.icon} size={20}/><span>{x.label}</span></Link>)}</nav>;
}
