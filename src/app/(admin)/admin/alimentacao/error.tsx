"use client";
export default function NutritionError({ reset }: { reset: () => void }) { return <section className="admin-state crm-empty"><h3>Não foi possível carregar a alimentação</h3><p>Verifique a conexão e tente novamente.</p><button className="button button-primary" onClick={reset}>Tentar novamente</button></section>; }
