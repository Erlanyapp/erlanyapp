import { PageHeader } from "@/components/ui";
import { Hero } from "@/components/client/client-components";
import { ContentSkeleton } from "@/components/client/route-skeleton";
export default function Loading() { return <div><PageHeader title="Dicas da Erlany" back /><Hero title={<>Mais que treino,<br />é um estilo<br />de vida!</>} icon="✦" className="tip-hero" /><ContentSkeleton label="as dicas" /></div>; }
