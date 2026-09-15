import Link from "next/link";
import { Avatar, IconButton } from "../ui";
import { BrandLogo } from "../branding/brand-logo";

export function AppHeader() {
  return <header className="app-header"><Link href="/app/inicio" className="header-logo"><BrandLogo variant="dark" /></Link><div className="header-actions"><IconButton className="icon-button" aria-label="Notificações">♧</IconButton><Link href="/app/mais" className="avatar-link"><Avatar>JS</Avatar></Link></div></header>;
}
