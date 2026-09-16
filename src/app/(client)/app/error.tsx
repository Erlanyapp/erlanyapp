"use client";
export default function ClientError({ reset }: { reset: () => void }) { return <section className="card account-panel"><h1>Não foi possível carregar</h1><p>Verifique sua conexão e tente novamente.</p><button className="button button-primary" onClick={reset} type="button">Tentar novamente</button></section>; }
