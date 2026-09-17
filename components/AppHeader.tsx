"use client";

import Image from "next/image";
import { motion } from "motion/react";
import { useBikerStore } from "@/store/useBikerStore";

/**
 * Cabeçalho do app — logo emoldurada como placa aparafusada + nome.
 * Fica maior e ganha um holofote extra atrás quando o AuthGate está
 * mostrando a tela de entrar/criar conta (telaLogin na useBikerStore):
 * é o "cartão de visita" da oficina antes de qualquer coisa, então
 * merece mais presença do que o cabeçalho discreto do resto do app.
 *
 * Antes havia uma caveira 3D (WebGL) girando aqui — trocada pela placa
 * estática (.placa-marca): um mascote 3D girando lê como "projeto de
 * hobby", uma placa de alumínio aparafusada lê como equipamento de
 * oficina de verdade.
 */
export default function AppHeader() {
  const telaLogin = useBikerStore((s) => s.telaLogin);

  return (
    <header
      className={`relative flex flex-col items-center gap-2 transition-[padding] duration-300 ${
        telaLogin ? "pb-3 pt-8" : "gap-3 pb-6 pt-10"
      }`}
    >
      {/* Halo atrás da logo em toda tela, não só no login — a referência
          que o Christian trouxe (weevolveit.com) ancora a página inteira
          numa esfera de luz enorme atrás do título; aqui é mais discreto
          fora do login, mas nunca some de vez, pra logo nunca ficar
          "flutuando" sobre o fundo sem nenhum apoio de luz. */}
      <motion.div
        aria-hidden="true"
        animate={{
          width: telaLogin ? 288 : 180,
          height: telaLogin ? 288 : 180,
          opacity: telaLogin ? 1 : 0.6,
        }}
        transition={{ type: "spring", stiffness: 200, damping: 28 }}
        className="pointer-events-none absolute left-1/2 top-2 -z-10 -translate-x-1/2 rounded-full"
        style={{
          background: "radial-gradient(circle, rgba(255,199,0,.20) 0%, rgba(255,199,0,.07) 42%, transparent 72%)",
          filter: "blur(6px)",
        }}
      />

      <motion.div
        animate={{ width: telaLogin ? 128 : 84, height: telaLogin ? 128 : 84 }}
        transition={{ type: "spring", stiffness: 260, damping: 26 }}
        className="placa-marca rounded-2xl p-2"
      >
        <span aria-hidden="true" className="placa-marca-rebite left-1.5 top-1.5" />
        <span aria-hidden="true" className="placa-marca-rebite right-1.5 top-1.5" />
        <span aria-hidden="true" className="placa-marca-rebite bottom-1.5 left-1.5" />
        <span aria-hidden="true" className="placa-marca-rebite bottom-1.5 right-1.5" />
        <Image
          src="/logo-tecnomotos.jpg"
          alt="TECNOMOTOS"
          width={112}
          height={112}
          className="h-full w-full rounded-lg object-cover"
          priority
        />
      </motion.div>

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
