"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * Botão de voltar, fixo no canto — aparece em toda página exceto a
 * inicial. Fica no layout uma vez só, então nenhuma página precisa
 * lembrar de incluir isso.
 */
export default function NavVoltar() {
  const pathname = usePathname();
  // "/" (home) e "/aprovar/..." (página pública que o cliente recebe
  // por WhatsApp, sem login — voltar levaria pro login/telas internas,
  // que não fazem sentido pra quem está de fora).
  if (pathname === "/" || pathname?.startsWith("/aprovar/")) return null;

  return (
    <Link
      href="/"
      aria-label="Voltar para o início"
      className="trail-plate group fixed left-4 top-4 z-40 flex h-11 w-11 items-center justify-center overflow-hidden rounded-full text-base font-bold text-zinc-900 transition-transform hover:-translate-y-0.5 active:scale-95"
    >
      <span className="relative z-10">←</span>
      <span aria-hidden="true" className="trail-plate-shine pointer-events-none absolute inset-0" />
    </Link>
  );
}
