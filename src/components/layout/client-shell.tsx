import type { ReactNode } from "react";
import { BottomNavigation } from "../navigation/bottom-navigation";
import { DesktopSidebar } from "./desktop-sidebar";
import { DesktopHeader } from "./desktop-header";
import type { Account } from "@/types/account";

export function ClientShell({ children, account, className = "" }: { children: ReactNode; account: Pick<Account, "name" | "avatarUrl">; className?: string }) {
  return <div className={`client-viewport ${className}`}><div className="client-shell"><DesktopSidebar /><div className="client-workspace"><DesktopHeader account={account} /><main className="client-content">{children}</main></div><BottomNavigation /></div></div>;
}
