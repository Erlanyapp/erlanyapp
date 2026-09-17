import { ContentSkeleton } from "@/components/client/route-skeleton";
import { AppIcon } from "@/components/icons";
export default function Loading() { return <div><header className="plans-reference-intro"><AppIcon name="crown" size={38} /><h1>Nossos planos</h1><p>Escolha o cuidado ideal para você<br />e comece hoje a sua transformação!</p></header><ContentSkeleton label="os planos" /></div>; }
