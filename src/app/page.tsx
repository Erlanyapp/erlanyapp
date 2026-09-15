import Link from "next/link";
import { BrandLogo } from "@/components/branding/brand-logo";

export default function FoundationPage() { return <main className="splash-page" aria-label="Tela inicial ERLANY FIT"><div className="splash-content"><div className="splash-brand"><BrandLogo variant="gold" /><p>Seu corpo,<br />seu cuidado,<br />sua evolução</p></div><div className="splash-cta"><Link className="button button-gold" href="/login">Vamos começar</Link></div></div></main>; }
