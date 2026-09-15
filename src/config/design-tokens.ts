export const designTokens = {
  colors: {
    primary: "#8E3FA3",
    primaryDark: "#5C285F",
    primaryLight: "#EBD8EF",
    veryLightPurple: "#F8EFF9",
    gold: "#C99A4A",
    goldLight: "#F0D49A",
    background: "#FFFFFF",
    offWhite: "#FCFAFC",
    text: "#3D3040",
    textMuted: "#8A7C8D"
  },
  typography: { sans: "Arial, Helvetica, sans-serif", display: "Georgia, serif" },
  radius: { sm: "8px", md: "16px", lg: "24px", pill: "999px" },
  shadows: { card: "0 12px 32px rgba(92, 40, 95, 0.10)" },
  spacing: { page: "24px", section: "32px" },
  breakpoints: { tablet: "768px", desktop: "1024px" },
  zIndex: { header: 20, modal: 50, toast: 60 },
  transitions: { standard: "180ms ease" }
} as const;
