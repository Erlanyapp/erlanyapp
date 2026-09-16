import type { ReactNode } from "react";
import { ClientShell } from "@/components/layout/client-shell";
import { getClientAccount } from "@/services/server-account";

export default async function ClientLayout({ children }: { children: ReactNode }) {
  const { account } = await getClientAccount();
  return <ClientShell account={account}>{children}</ClientShell>;
}
