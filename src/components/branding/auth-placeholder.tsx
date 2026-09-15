import Link from "next/link";
import { BrandLogo } from "./brand-logo";

export function AuthPlaceholder({ title, description }: { title: string; description: string }) {
  return <main className="auth-page"><div className="auth-panel"><BrandLogo variant="gold" /><h1 className="auth-title">{title}</h1><p className="auth-slogan">{description}</p><div className="auth-form"><button className="button button-primary full-width" type="button">Continuar</button></div><p className="auth-signup"><Link href="/login">Voltar para entrar</Link></p></div></main>;
}
