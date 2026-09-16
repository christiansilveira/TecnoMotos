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
  if (pathname === "/") return null;

  return (
    <Link
      href="/"
      aria-label="Voltar para o início"
      className="vidro-garagem fixed left-4 top-4 z-40 flex h-11 w-11 items-center justify-center rounded-full text-lg text-zinc-200 transition-transform hover:-translate-y-0.5 active:scale-95"
    >
      ←
    </Link>
  );
}
