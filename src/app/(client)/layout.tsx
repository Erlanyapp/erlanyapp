import type { ReactNode } from "react";
import { ClientShell } from "@/components/layout/client-shell";
import { getClientAccount } from "@/services/server-account";
import { Roboto } from "next/font/google";
import "./client-reference.css";

const clientFont = Roboto({ subsets: ["latin"], weight: ["400", "500", "700"], variable: "--font-client-sans", display: "swap" });

export default async function ClientLayout({ children }: { children: ReactNode }) {
  await getClientAccount();
  return <ClientShell className={clientFont.variable}>{children}</ClientShell>;
}
