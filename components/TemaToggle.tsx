"use client";

import { useBikerStore } from "@/store/useBikerStore";

/**
 * Alternador dark/light — pedido do Christian: um "modo claro" com
 * degradês azuis e detalhes pretos, ao lado do escuro industrial que já
 * existia. Fica no header, pequeno, no mesmo espírito de placa dos
 * outros controles (não é um switch genérico de SaaS).
 */
export default function TemaToggle() {
  const tema = useBikerStore((s) => s.tema);
  const alternarTema = useBikerStore((s) => s.alternarTema);
  const claro = tema === "claro";

  return (
    <button
      type="button"
      onClick={alternarTema}
      aria-label={claro ? "Mudar para tema escuro" : "Mudar para tema claro"}
      title={claro ? "Tema escuro" : "Tema claro"}
      className="trail-plate fixed right-4 top-4 z-40 flex h-11 w-11 items-center justify-center rounded-full text-zinc-900 transition-transform hover:-translate-y-0.5 active:scale-95"
    >
      {claro ? (
        // lua — indica que clicar leva pro escuro
        <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      ) : (
        // sol — indica que clicar leva pro claro
        <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
        </svg>
      )}
    </button>
  );
}
