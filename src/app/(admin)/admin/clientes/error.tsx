"use client";
export default function ClientsError({reset}:{reset:()=>void}) {
  return <section className="admin-state crm-empty" role="alert"><h2>Não foi possível carregar os clientes</h2><p>Confira os filtros e tente novamente. Nenhum estado vazio está sendo apresentado como sucesso.</p><div className="crm-error-actions"><button className="button button-primary" onClick={reset}>Tentar novamente</button>{/* A native GET deliberately resets a boundary retained across search-param changes. */}<form action="/admin/clientes" method="get"><button className="button button-secondary" type="submit">Limpar filtros e voltar</button></form></div></section>;
}
