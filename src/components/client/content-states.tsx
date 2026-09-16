import { EmptyState } from "@/components/ui";
import { RetryContent } from "./retry-content";

export function ContentError({ label }: { label: string }) {
  return <section role="alert" className="content-error"><EmptyState title="Não foi possível carregar" description={`Não foi possível carregar ${label}. Tente novamente.`} /><RetryContent /></section>;
}

export function ContentLoading({ label }: { label: string }) {
  return <p className="muted" role="status">Carregando {label}...</p>;
}
