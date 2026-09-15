import { Suspense } from "react";
import Link from "next/link";
import { BrandLogo } from "@/components/branding/brand-logo";
import { AuthForm } from "@/components/auth/auth-form";

/* Social buttons are rendered by AuthForm so all providers share one real handler. */
function LegacySocialIcon({ name }: { name: "google" | "apple" | "facebook" }) {
  if (name === "apple") return <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M16.7 12.8c0-2 1.6-3 1.7-3.1-.9-1.4-2.4-1.6-2.9-1.6-1.2-.1-2.3.7-2.9.7-.6 0-1.5-.7-2.5-.7-1.3 0-2.5.8-3.2 1.9-1.4 2.3-.4 5.7 1 7.6.7.9 1.5 1.9 2.6 1.8 1 0 1.4-.6 2.6-.6s1.5.6 2.6.6c1.1 0 1.8-.9 2.5-1.8.8-1.1 1.1-2.2 1.1-2.2s-2.1-.8-2.1-2.6ZM14.8 6.9c.5-.6.8-1.5.7-2.4-.8 0-1.7.5-2.3 1.1-.5.5-.8 1.4-.7 2.3.9.1 1.8-.4 2.3-1Z" /></svg>;
  if (name === "facebook") return <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M13.5 21v-8h2.7l.4-3h-3.1V8.1c0-.9.3-1.5 1.6-1.5h1.7V4c-.3 0-1.3-.1-2.4-.1-2.4 0-4 1.5-4 4.1V10H8v3h2.4v8h3.1Z" /></svg>;
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="#4285F4" d="M21.6 12.2c0-.7-.1-1.4-.2-2H12v3.8h5.4a4.7 4.7 0 0 1-2 3.1v2.5h3.2c1.9-1.8 3-4.3 3-7.4Z"/><path fill="#34A853" d="M12 22c2.7 0 5-.9 6.6-2.4l-3.2-2.5c-.9.6-2 .9-3.4.9-2.6 0-4.8-1.8-5.6-4.2H3.1v2.6A10 10 0 0 0 12 22Z"/><path fill="#FBBC05" d="M6.4 13.8a6 6 0 0 1 0-3.6V7.6H3.1a10 10 0 0 0 0 8.8l3.3-2.6Z"/><path fill="#EA4335" d="M12 6c1.5 0 2.8.5 3.8 1.5l2.9-2.9C17 3 14.7 2 12 2a10 10 0 0 0-8.9 5.6l3.3 2.6C7.2 7.8 9.4 6 12 6Z"/></svg>;
}

void LegacySocialIcon;

export default function LoginPage() { return <main className="auth-page login-page"><div className="auth-panel login-panel"><BrandLogo variant="gold" /><p className="auth-slogan">Seu corpo, seu cuidado,<br />sua evolução</p><Suspense fallback={<p className="muted">Carregando...</p>}><AuthForm mode="login" /></Suspense><p className="auth-signup">Você ainda não tem uma conta? <Link href="/cadastro">Cadastre-se</Link></p></div></main>; }
