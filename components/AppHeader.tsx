"use client";

import Image from "next/image";
import { motion } from "motion/react";
import SkullHeader3D from "./SkullHeader3D";
import { useBikerStore } from "@/store/useBikerStore";

/**
 * Cabeçalho do app — logo + caveira 3D + nome. Fica maior e ganha um
 * holofote extra atrás quando o AuthGate está mostrando a tela de
 * entrar/criar conta (telaLogin na useBikerStore): é o "cartão de
 * visita" da oficina antes de qualquer coisa, então merece mais
 * presença do que o cabeçalho discreto do resto do app.
 */
export default function AppHeader() {
  const telaLogin = useBikerStore((s) => s.telaLogin);

  return (
    <header
      className={`relative flex flex-col items-center gap-2 transition-[padding] duration-300 ${
        telaLogin ? "pb-3 pt-8" : "gap-3 pb-6 pt-10"
      }`}
    >
      {telaLogin && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-2 -z-10 h-72 w-72 -translate-x-1/2 rounded-full"
          style={{
            background: "radial-gradient(circle, rgba(255,199,0,.20) 0%, rgba(255,199,0,.07) 42%, transparent 72%)",
            filter: "blur(6px)",
          }}
        />
      )}

      <motion.div
        animate={{ width: telaLogin ? 112 : 72, height: telaLogin ? 112 : 72 }}
        transition={{ type: "spring", stiffness: 260, damping: 26 }}
      >
        <Image
          src="/logo-tecnomotos.jpg"
          alt="TECNOMOTOS"
          width={112}
          height={112}
          className="h-full w-full rounded-2xl border border-white/10 object-cover shadow-[0_12px_32px_-12px_rgba(0,0,0,.8)]"
          priority
        />
      </motion.div>

      <SkullHeader3D />

      <motion.h1
        animate={{ fontSize: telaLogin ? "2.25rem" : "1.875rem" }}
        transition={{ type: "spring", stiffness: 260, damping: 26 }}
        className="font-display uppercase tracking-widest text-zinc-50"
      >
        TECNOMOTOS
      </motion.h1>

      {telaLogin && (
        <p className="-mt-1 text-[11px] uppercase tracking-[.3em] text-zinc-500">Sistema da oficina</p>
      )}
    </header>
  );
}
