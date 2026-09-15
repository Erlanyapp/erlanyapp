import Image from "next/image";

type BrandLogoProps = { variant?: "dark" | "light" | "gold" | "compact" };

export function BrandLogo({ variant = "dark" }: BrandLogoProps) {
  const compact = variant === "compact";
  if (variant === "gold") return <span className="brand-logo brand-logo-gold brand-logo-official"><Image src="/assets/branding/erlany-fit-logo.png" alt="ERLANY FIT" width={150} height={150} priority /></span>;
  return <span className={`brand-logo brand-logo-${variant}`} aria-label="ERLANY FIT"><span className="brand-mark">✦</span><span><strong>ERLANY</strong>{!compact && <small>FIT</small>}</span></span>;
}
