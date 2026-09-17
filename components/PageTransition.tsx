"use client";

import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import type { ReactNode } from "react";

/**
 * Troca de tela com um leve mergulho + deslizada, no lugar do corte seco
 * padrão do App Router. Sutil de propósito — combina com o resto do app
 * (nada "histérico"): sobe 10px e ganha opacidade, ~250ms.
 */
export default function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -6 }}
        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
