import Link from "next/link";
import { BrandLogo } from "./brand-logo";

export function AuthPlaceholder({ title, description }: { title: string; description: string }) {
  const signup = title === "Criar conta";
  return <main className="auth-page"><div className="auth-panel"><BrandLogo variant="gold" /><h1 className="auth-title">{title}</h1><p className="auth-slogan">{description}</p><form className="auth-form">{signup && <label>Nome<input type="text" placeholder="Seu nome" /></label>}<label>E-mail<input type="email" placeholder="seu@email.com" /></label>{signup && <label>Senha<input type="password" placeholder="Crie uma senha" /></label>}<button className="button button-primary full-width" type="button">{signup ? "Criar conta" : "Enviar instruções"}</button></form><p className="auth-signup"><Link href="/login">Voltar para entrar</Link></p></div></main>;
}
