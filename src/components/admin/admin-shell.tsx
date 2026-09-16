import Image from "next/image";
import Link from "next/link";
import { LogoutButton } from "@/components/auth/logout-button";
import { AdminNavigation } from "./admin-navigation";
import { AdminHeader } from "./admin-header";
export function AdminShell({children,administrator}:{children:React.ReactNode;administrator:{name:string;avatarUrl:string|null}}) {
  return <div className="admin-viewport"><aside className="admin-sidebar"><Link className="crm-brand" href="/admin" aria-label="ERLANY FIT — Dashboard"><Image src="/assets/branding/erlany-fit-logo.png" alt="ERLANY FIT" width={130} height={130} sizes="130px"/></Link><p className="admin-overline">CRM ADMINISTRATIVO</p><AdminNavigation/><div className="admin-logout"><LogoutButton/></div></aside><div className="admin-frame"><AdminHeader administrator={administrator}/><main className="admin-main">{children}</main></div></div>;
}
