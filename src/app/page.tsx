import Link from "next/link";
import Image from "next/image";
import { BrandLogo } from "@/components/branding/brand-logo";

export default function FoundationPage() {
  return (
    <main className="splash-page" aria-label="Tela inicial ERLANY FIT">
      <div className="splash-backdrop" aria-hidden="true">
        <Image
          src="/assets/branding/a_wide_cinematic_high_resolution_fitness_theme.png"
          alt=""
          fill
          priority
          sizes="100vw"
        />
      </div>
      <div className="splash-art-frame" aria-hidden="true">
        <Image
          src="/assets/branding/a_wide_cinematic_high_resolution_fitness_theme.png"
          alt=""
          fill
          priority
          sizes="100vw"
        />
      </div>
      <div className="splash-content">
        <div className="splash-brand">
          <BrandLogo variant="gold" />
          <p>Seu corpo,<br />seu cuidado,<br />sua evolução</p>
        </div>
        <div className="splash-cta">
          <Link className="button button-gold" href="/login">Vamos começar</Link>
        </div>
      </div>
    </main>
  );
}
