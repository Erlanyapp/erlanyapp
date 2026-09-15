type LogoVariant = "default" | "light" | "gold" | "compact";
export function Logo({ variant = "default" }: { variant?: LogoVariant }) {
  const color = variant === "light" ? "#FFFFFF" : variant === "gold" ? "#C99A4A" : "#5C285F";
  return <span aria-label="ERLANY FIT" style={{ color, fontFamily: "Georgia, serif", letterSpacing: ".12em", fontSize: variant === "compact" ? 14 : 18 }}>ERLANY {variant === "compact" ? "" : "FIT"}</span>;
}
