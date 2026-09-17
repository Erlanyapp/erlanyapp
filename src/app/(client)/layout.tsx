import type { ReactNode } from "react";
import { ClientShell } from "@/components/layout/client-shell";
import { getClientAccount } from "@/services/server-account";
import { Roboto } from "next/font/google";
import { ClientRoutePrefetch } from "@/components/client/client-route-prefetch";
import "./client-reference.css";
import "./client-desktop.css";
import "./client-loading.css";

const clientFont = Roboto({ subsets: ["latin"], weight: ["400", "500", "700"], variable: "--font-client-sans", display: "swap" });

export default async function ClientLayout({ children }: { children: ReactNode }) {
  const { account } = await getClientAccount();
  return <ClientShell className={clientFont.variable} account={{ name: account.name, avatarUrl: account.avatarUrl }}><ClientRoutePrefetch />{children}</ClientShell>;
}
