import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "ERLANY FIT", description: "Seu corpo, seu cuidado, sua evolução" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="pt-BR"><body>{children}</body></html>;
}
