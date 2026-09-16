"use client";

import { useEffect, useState } from "react";
import PainelVidro from "./PainelVidro";

const SENHA = "2468";
const CHAVE_SESSAO = "tecnomotos-dashboard-destravado";

/**
 * Trava simples do Dashboard — segura o curioso no balcão, não
 * protege de quem sabe abrir as ferramentas do navegador. Fica
 * destravado até a aba fechar (sessionStorage), igual ao app original.
 */
export default function TrancaDashboard({ children }: { children: React.ReactNode }) {
  const [destravado, setDestravado] = useState(false);
  const [pronto, setPronto] = useState(false);
  const [pin, setPin] = useState("");
  const [erro, setErro] = useState(false);

  useEffect(() => {
    setDestravado(sessionStorage.getItem(CHAVE_SESSAO) === "1");
    setPronto(true);
  }, []);

  const digitar = (d: string) => {
    if (pin.length >= SENHA.length) return;
    const novo = pin + d;
    setPin(novo);
    setErro(false);
    if (novo.length === SENHA.length) {
      setTimeout(() => {
        if (novo === SENHA) {
          sessionStorage.setItem(CHAVE_SESSAO, "1");
          setDestravado(true);
        } else {
          setErro(true);
          setPin("");
        }
      }, 150);
    }
  };

  if (!pronto) return null;
  if (destravado) return <>{children}</>;

  return (
    <div className="flex flex-col items-center gap-6 pt-10">
      <p className="text-xs uppercase tracking-[.2em] text-zinc-500">Área restrita — digite a senha</p>
      <div className="flex gap-3" aria-label={`${pin.length} de ${SENHA.length} dígitos`}>
        {Array.from({ length: SENHA.length }).map((_, i) => (
          <span
            key={i}
            className={`h-3 w-3 rounded-full border ${i < pin.length ? "border-zinc-200 bg-zinc-200" : "border-white/20"}`}
          />
        ))}
      </div>
      <p className={`h-4 text-sm text-red-400 ${erro ? "" : "invisible"}`}>Senha incorreta</p>
      <div className="grid grid-cols-3 gap-3">
        {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((d) => (
          <button key={d} onClick={() => digitar(d)} className="transition-transform active:scale-95">
            <PainelVidro className="flex h-16 w-16 items-center justify-center font-mono text-xl font-bold text-zinc-100">
              {d}
            </PainelVidro>
          </button>
        ))}
        <span />
        <button onClick={() => digitar("0")} className="transition-transform active:scale-95">
          <PainelVidro className="flex h-16 w-16 items-center justify-center font-mono text-xl font-bold text-zinc-100">
            0
          </PainelVidro>
        </button>
        <button onClick={() => setPin((p) => p.slice(0, -1))} aria-label="Apagar" className="transition-transform active:scale-95">
          <PainelVidro className="flex h-16 w-16 items-center justify-center text-zinc-400">←</PainelVidro>
        </button>
      </div>
    </div>
  );
}
