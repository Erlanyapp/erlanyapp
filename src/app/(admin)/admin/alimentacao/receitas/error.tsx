"use client";
export default function RecipesError({ reset }: { reset: () => void }) { return <div className="admin-state"><h2>Não foi possível carregar as receitas</h2><button className="button button-primary" onClick={reset}>Tentar novamente</button></div>; }
