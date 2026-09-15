type BrandLogoProps = { variant?: "dark" | "light" | "gold" | "compact" };

export function BrandLogo({ variant = "dark" }: BrandLogoProps) {
  const compact = variant === "compact";
  return <span className={`brand-logo brand-logo-${variant}`} aria-label="ERLANY FIT"><span className="brand-mark">✦</span><span><strong>ERLANY</strong>{!compact && <small>FIT</small>}</span></span>;
}
