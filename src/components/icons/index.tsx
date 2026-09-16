import type { ReactNode, SVGProps } from "react";

export type IconName = "home" | "workout" | "progress" | "nutrition" | "tips" | "more" | "profile" | "settings" | "achievement" | "bell" | "chat" | "help" | "logout" | "arrow-right" | "sparkle" | "crown" | "media";
type IconProps = SVGProps<SVGSVGElement> & { name: IconName; size?: number };

const paths: Record<IconName, ReactNode> = {
  media: <><rect x="3" y="4" width="18" height="16" rx="2" /><circle cx="8" cy="9" r="1.5" /><path d="m4 17 5-5 4 4 3-3 4 4" /></>,
  crown: <><path d="m3 6 4 4 5-7 5 7 4-4-2 13H5L3 6Z" fill="currentColor" /><path d="M6 22h12" /></>,
  home: <><path d="m3 10 9-7 9 7" /><path d="M5 9v10h14V9M9 19v-6h6v6" /></>,
  workout: <><path d="M6 8v8M3.5 10v4M18 8v8M20.5 10v4M6 12h12" /></>,
  progress: <><path d="M4 18V6M4 18h16" /><path d="m7 14 3-3 2 2 5-6" /></>,
  nutrition: <><path d="M12 20c-4 0-7-3.2-7-7.2C5 8.5 7.7 6 11 6c1.1 0 2.1.3 3 .8C15 6.3 16.1 6 17 6c.5 0 .9.1 1.4.2" /><path d="M12 6c0-2 1.4-3.5 3.5-4 .1 2.1-1 3.5-3.5 4Z" /></>,
  tips: <><path d="M9 18h6M10 22h4" /><path d="M8.4 14.5A6 6 0 1 1 16 14c-.8.6-1.2 1.4-1.2 2H9.2c0-.6-.3-1.1-.8-1.5Z" /><path d="M12 2v1M4.9 4.9l.7.7M19.1 4.9l-.7.7" /></>,
  more: <><circle cx="5" cy="12" r="1" fill="currentColor" stroke="none" /><circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" /><circle cx="19" cy="12" r="1" fill="currentColor" stroke="none" /></>,
  profile: <><circle cx="12" cy="8" r="3.5" /><path d="M5 20c.7-3.2 3-5 7-5s6.3 1.8 7 5" /></>,
  settings: <><circle cx="12" cy="12" r="3" /><path d="m19 12 2 1-2 3-2-.5-1.5 1.5.5 2h-3l-1-2h-2l-1 2H6l.5-2L5 15l-2 .5-1-3 2-1v-2L2 8.5l1-3L5 6l1.5-1.5L6 2.5h3l1 2h2l1-2h3l-.5 2L17 6l2-.5 1 3-2 1v2Z" /></>,
  achievement: <><path d="M8 4h8v5a4 4 0 0 1-8 0V4Z" /><path d="M8 6H5v2a3 3 0 0 0 3 3M16 6h3v2a3 3 0 0 1-3 3M12 13v4M8 21h8M9 17h6" /></>,
  bell: <><path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9ZM10 21h4" /></>,
  chat: <><path d="M20 11.5a7.5 7.5 0 0 1-8 7.5 8.6 8.6 0 0 1-3.2-.6L4 20l1.5-4A7.1 7.1 0 0 1 4 11.5 7.5 7.5 0 0 1 12 4a7.5 7.5 0 0 1 8 7.5Z" /><path d="M8 12h.01M12 12h.01M16 12h.01" /></>,
  help: <><circle cx="12" cy="12" r="9" /><path d="M9.6 9a2.5 2.5 0 1 1 4.2 1.8c-1 .8-1.8 1.1-1.8 2.7M12 17h.01" /></>,
  logout: <><path d="M10 5H5v14h5M14 8l4 4-4 4M18 12H9" /></>,
  "arrow-right": <><path d="M5 12h13M13 6l6 6-6 6" /></>,
  sparkle: <><path d="m12 2 1.3 6.7L20 10l-6.7 1.3L12 18l-1.3-6.7L4 10l6.7-1.3L12 2Z" /></>,
};

export function AppIcon({ name, size = 22, strokeWidth = 1.7, ...props }: IconProps) {
  return <svg aria-hidden="true" fill="none" height={size} viewBox="0 0 24 24" width={size} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokeWidth} {...props}>{paths[name]}</svg>;
}

export function iconNameFromSymbol(symbol: string): IconName {
  if (symbol === "♡") return "tips";
  if (symbol === "♧") return "workout";
  if (symbol === "⌁" || symbol === "∿") return "progress";
  if (symbol === "◒" || symbol === "◈") return "nutrition";
  if (symbol === "↗") return "progress";
  return "sparkle";
}
