import { EmptyState } from "@/components/ui";

export function ContentError({ label }: { label: string }) {
  return <EmptyState title="Não foi possível carregar" description={`Não foi possível carregar ${label}. Tente novamente.`} />;
}

export function ContentLoading({ label }: { label: string }) {
  return <p className="muted" role="status">Carregando {label}...</p>;
}
