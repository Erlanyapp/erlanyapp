import Link from "next/link";

export function PageHeader({ title, back = false }: { title: string; back?: boolean }) {
  return <header className="page-header">{back ? <Link href="/app/inicio" aria-label="Voltar">‹</Link> : <span className="page-header-spacer" />}<h1>{title}</h1><span className="page-header-spacer" /></header>;
}
