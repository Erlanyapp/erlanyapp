import { AppIcon } from "@/components/icons";

export function EmptyState({ title, description }: { title: string; description: string }) {
  return <div className="empty-state"><span className="empty-state-icon"><AppIcon name="sparkle" size={28} /></span><h2>{title}</h2><p>{description}</p></div>;
}
