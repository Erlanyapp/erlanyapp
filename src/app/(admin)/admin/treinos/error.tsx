"use client";

export default function WorkoutsError({ reset }: { reset: () => void }) {
  return (
    <section className="crm-table-panel" role="alert">
      <p>Não foi possível carregar os treinos.</p>
      <button className="button button-outline" onClick={reset} type="button">
        Tentar novamente
      </button>
    </section>
  );
}
