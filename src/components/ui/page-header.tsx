import Link from "next/link";

export function PageHeader({ title, back = false, backHref = "/app/inicio" }: { title: string; back?: boolean; backHref?: string }) {
  return <header className="page-header">{back ? <Link href={backHref} aria-label="Voltar">‹</Link> : <span className="page-header-spacer" />}<h1>{title}</h1><span className="page-header-spacer" /></header>;
}
