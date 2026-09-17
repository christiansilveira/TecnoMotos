"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";
import { motion } from "motion/react";
import { useBikerStore } from "@/store/useBikerStore";

type TrailPlateButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "onAnimationStart" | "onDrag" | "onDragStart" | "onDragEnd"> & {
  children: ReactNode;
  /** Número exibido no canto, tipo placa numerada de rally (ex.: "07"). Opcional. */
  numero?: string;
};

/**
 * Botão no formato de placa numerada de moto de trilha: moldura de
 * alumínio escovado, respingo de barro discreto nos cantos, relevo
 * físico ao clicar. O CSS complexo (metálico, brilho, barro) mora em
 * globals.css como classes .trail-plate* — o Tailwind não alcança
 * esse nível de acabamento sozinho.
 *
 * Todo clique dispara um boost na useBikerStore: é isso que acelera
 * o giro da caveira 3D no header e a poeira do fundo.
 */
export default function TrailPlateButton({
  children,
  numero,
  className = "",
  onClick,
  ...props
}: TrailPlateButtonProps) {
  const triggerBoost = useBikerStore((s) => s.triggerBoost);

  return (
    <motion.button
      {...props}
      onClick={(evento) => {
        triggerBoost();
        onClick?.(evento);
      }}
      whileHover={props.disabled ? undefined : { y: -2 }}
      whileTap={props.disabled ? undefined : { scale: 0.96, y: 1 }}
      transition={{ type: "spring", stiffness: 500, damping: 30 }}
      className={`trail-plate group relative isolate overflow-hidden rounded-md px-6 py-3 text-sm font-bold uppercase tracking-wider text-zinc-900 ${className}`}
    >
      {numero && (
        <span className="pointer-events-none absolute left-2 top-1.5 font-mono text-[10px] font-bold text-zinc-700/70">
          Nº{numero}
        </span>
      )}
      <span className="relative z-10">{children}</span>
      <span aria-hidden="true" className="trail-plate-shine pointer-events-none absolute inset-0" />
      <span aria-hidden="true" className="trail-plate-grunge trail-plate-grunge-a pointer-events-none absolute" />
      <span aria-hidden="true" className="trail-plate-grunge trail-plate-grunge-b pointer-events-none absolute" />
    </motion.button>
  );
}
