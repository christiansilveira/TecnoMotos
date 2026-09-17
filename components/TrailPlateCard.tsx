"use client";

import type { ReactNode } from "react";
import { useBikerStore } from "@/store/useBikerStore";

interface TrailPlateCardProps {
  children: ReactNode;
  numero?: string;
  className?: string;
}

/**
 * Versão "cartão" da placa metálica do TrailPlateButton — mesmo
 * acabamento (alumínio escovado, relevo, brilho no hover, barro nos
 * cantos), só que em formato de bloco pra abrigar título + descrição
 * em vez de um rótulo de botão. É o que os 4 painéis principais da
 * Home usam agora: pedido do Christian pra trazer o modelo de placa
 * pros botões grandes e principais do sistema, não só pra CTAs soltos.
 * Não é um <button> — quem usa isso decide a semântica (normalmente
 * dentro de um <Link>) — mas ainda dispara o boost tátil no clique,
 * igual a qualquer outra placa do app.
 */
export default function TrailPlateCard({ children, numero, className = "" }: TrailPlateCardProps) {
  const triggerBoost = useBikerStore((s) => s.triggerBoost);

  return (
    <div
      onClick={() => triggerBoost()}
      className={`trail-plate group relative isolate h-full overflow-hidden rounded-xl p-5 text-zinc-900 transition-transform hover:-translate-y-1 active:scale-[.98] ${className}`}
    >
      {numero && (
        <span className="pointer-events-none absolute right-3 top-3 font-mono text-[10px] font-bold text-zinc-700/60">
          Nº{numero}
        </span>
      )}
      <div className="relative z-10">{children}</div>
      <span aria-hidden="true" className="trail-plate-shine pointer-events-none absolute inset-0" />
      <span aria-hidden="true" className="trail-plate-grunge trail-plate-grunge-a pointer-events-none absolute" />
      <span aria-hidden="true" className="trail-plate-grunge trail-plate-grunge-b pointer-events-none absolute" />
    </div>
  );
}
