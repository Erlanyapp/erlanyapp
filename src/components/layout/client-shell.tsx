import type { ReactNode } from "react";
import { AppHeader } from "./app-header";
import { BottomNavigation } from "../navigation/bottom-navigation";

export function ClientShell({ children }: { children: ReactNode }) {
  return <div className="client-viewport"><div className="client-shell"><AppHeader /><main className="client-content">{children}</main><BottomNavigation /></div></div>;
}
