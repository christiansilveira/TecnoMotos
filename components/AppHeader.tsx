"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import { useBikerStore } from "@/store/useBikerStore";
import TemaToggle from "./TemaToggle";
import { IcoVoltar, NAV, rotaAtiva } from "./icones";

/**
 * Barra superior fixa e compacta (design Obsidiana): voltar + marca à
 * esquerda, navegação no meio (computador) e tema à direita. Na tela
 * de login a marca vira o centro da página, grande, com halo.
 */
export default function AppHeader() {
  const telaLogin = useBikerStore((s) => s.telaLogin);
  const pathname = usePathname();
  const publica = pathname?.startsWith("/aprovar/");

  if (telaLogin) {
    return (
      <header className="relative flex flex-col items-center gap-4 pb-4 pt-12">
        <div className="absolute right-4 top-4"><TemaToggle /></div>
        <div aria-hidden="true" className="pointer-events-none absolute left-1/2 top-4 -z-10 h-72 w-72 -translate-x-1/2 rounded-full" style={{ background: "radial-gradient(circle, rgb(var(--cor-acento-rgb) / .22), transparent 68%)", filter: "blur(10px)" }} />
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="placa-marca h-28 w-28 overflow-hidden rounded-[28px]">
          <Image src="/logo-tecnomotos.jpg" alt="TECNOMOTOS" width={112} height={112} className="h-full w-full object-cover" priority />
        </motion.div>
        <h1 className="font-display text-3xl uppercase text-zinc-50">Tecnomotos</h1>
      </header>
    );
  }

  const mostrarVoltar = pathname !== "/" && !publica;
  return (
    <header className="barra-topo sticky top-0 z-40 mb-6">
      <div className="mx-auto flex h-16 max-w-5xl items-center gap-3 px-4">
        {mostrarVoltar && (
          <Link href="/" aria-label="Voltar para o início" className="icone-btn sm:hidden"><IcoVoltar size={18} /></Link>
        )}
        <Link href="/" className="flex min-w-0 items-center gap-2.5">
          <span className="placa-marca h-9 w-9 shrink-0 overflow-hidden rounded-[11px]">
            <Image src="/logo-tecnomotos.jpg" alt="" width={36} height={36} className="h-full w-full object-cover" priority />
          </span>
          <span className="font-display truncate text-[15px] uppercase text-zinc-50">Tecnomotos</span>
        </Link>
        {!publica && (
          <nav className="ml-6 hidden items-center gap-1 sm:flex" aria-label="Navegação principal">
            {NAV.map(({ href, rotulo }) => {
              const ativo = rotaAtiva(pathname, href);
              return (
                <Link key={href} href={href} className={`rounded-full px-3.5 py-1.5 text-sm font-semibold transition-colors ${ativo ? "bg-white/10 text-zinc-50" : "text-zinc-400 hover:text-zinc-100"}`}>
                  {rotulo}
                </Link>
              );
            })}
          </nav>
        )}
        <div className="ml-auto"><TemaToggle /></div>
      </div>
    </header>
  );
}
