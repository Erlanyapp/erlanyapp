import Link from "next/link";
import { Suspense } from "react";
import { BrandLogo } from "./brand-logo";
import { AuthForm } from "@/components/auth/auth-form";

export function AuthPlaceholder({ title, description, mode = "reset" }: { title: string; description: string; mode?: "signup" | "reset" }) {
  return <main className="auth-page"><div className="auth-panel"><BrandLogo variant="gold" /><h1 className="auth-title">{title}</h1><p className="auth-slogan">{description}</p><Suspense fallback={<p className="muted">Carregando...</p>}><AuthForm mode={mode} /></Suspense><p className="auth-signup"><Link href="/login">Voltar para entrar</Link></p></div></main>;
}
