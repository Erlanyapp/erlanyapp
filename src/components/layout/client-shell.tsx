import type { ReactNode } from "react";
import { AppHeader } from "./app-header";
import { BottomNavigation } from "../navigation/bottom-navigation";
import type { Account } from "@/types/account";

export function ClientShell({ children, account }: { children: ReactNode; account: Account }) {
  return <div className="client-viewport"><div className="client-shell"><AppHeader account={account} /><main className="client-content">{children}</main><BottomNavigation /></div></div>;
}
