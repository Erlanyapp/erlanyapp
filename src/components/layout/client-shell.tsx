import type { ReactNode } from "react";
import { BottomNavigation } from "../navigation/bottom-navigation";

export function ClientShell({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`client-viewport ${className}`}><div className="client-shell"><main className="client-content">{children}</main><BottomNavigation /></div></div>;
}
