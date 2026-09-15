import Link from "next/link";
import { BrandLogo } from "@/components/branding/brand-logo";

export default function FoundationPage() { return <main className="splash-page"><div className="splash-art" aria-label="Mulher de costas com roupa fitness roxa, conforme a referência visual" /><div className="splash-content"><BrandLogo variant="gold" /><p>Seu corpo,<br />seu cuidado,<br />sua evolução</p><Link className="button button-gold" href="/login">Vamos começar</Link></div></main>; }
