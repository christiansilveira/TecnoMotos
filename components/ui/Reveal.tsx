"use client";

import { motion, type Variants } from "motion/react";
import type { ReactNode } from "react";

const EASE_SAINDO_DA_GARAGEM = [0.22, 1, 0.36, 1] as const;

const CONTAINER: Variants = {
  oculto: {},
  visivel: {
    transition: { staggerChildren: 0.07, delayChildren: 0.04 },
  },
};

const ITEM: Variants = {
  oculto: { opacity: 0, y: 18 },
  visivel: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: EASE_SAINDO_DA_GARAGEM },
  },
};

/**
 * Envelope de entrada em cascata: os filhos diretos (RevealItem) sobem e
 * ganham opacidade um pouco depois um do outro, como faróis acendendo em
 * sequência — em vez de a tela inteira "piscar" de uma vez. Roda uma única
 * vez por montagem, não repete ao rolar a página.
 */
export function RevealGroup({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <motion.div className={className} initial="oculto" animate="visivel" variants={CONTAINER}>
      {children}
    </motion.div>
  );
}

export function RevealItem({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <motion.div className={className} variants={ITEM}>
      {children}
    </motion.div>
  );
}
