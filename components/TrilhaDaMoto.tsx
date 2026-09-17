"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { DEMO, supabase } from "@/lib/supabase";
import { ORDENS_DEMO } from "@/lib/dados-demo";
import { COLUNAS_KANBAN, STATUS_COR, STATUS_LABEL, type StatusOS } from "@/lib/tipos";

/**
 * "Trilha da moto" — a esteira de checkpoints da Home, no mesmo espírito
 * das faixas de pneu do fundo (TireTrackBackground): cada etapa do
 * fluxo de uma OS (recepção → diagnóstico → ... → finalizado) vira um
 * marco na trilha, com a contagem de motos paradas ali agora. O ponto
 * acende (glow) quando tem pelo menos uma OS na etapa — trilha apagada
 * é trilha sem gente trabalhando.
 */
export default function TrilhaDaMoto() {
  const [contagem, setContagem] = useState<Record<StatusOS, number> | null>(null);

  useEffect(() => {
    let vivo = true;

    const contar = (status: StatusOS[]) => {
      const mapa = Object.fromEntries(COLUNAS_KANBAN.map((s) => [s, 0])) as Record<StatusOS, number>;
      for (const s of status) if (s in mapa) mapa[s as StatusOS]++;
      return mapa;
    };

    if (DEMO || !supabase) {
      setContagem(contar(ORDENS_DEMO.map((o) => o.status)));
      return;
    }
    const cliente = supabase;

    const carregar = async () => {
      const { data } = await cliente
        .from("ordens_servico")
        .select("status")
        .not("status", "in", "(entregue,cancelado)");
      if (vivo) setContagem(contar((data ?? []).map((o) => o.status as StatusOS)));
    };
    carregar();

    const canal = cliente
      .channel("trilha-home")
      .on("postgres_changes", { event: "*", schema: "public", table: "ordens_servico" }, carregar)
      .subscribe();
    return () => {
      vivo = false;
      cliente.removeChannel(canal);
    };
  }, []);

  const total = contagem ? Object.values(contagem).reduce((a, b) => a + b, 0) : null;

  return (
    <div className="vidro-garagem rounded-xl p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-sm uppercase tracking-wide text-zinc-200">Trilha da Moto</h2>
        <span className="font-mono text-xs text-zinc-500">
          {total === null ? "…" : `${total} em aberto`}
        </span>
      </div>

      <div className="relative flex gap-0 overflow-x-auto pb-2">
        {COLUNAS_KANBAN.map((status, i) => {
          const n = contagem?.[status] ?? 0;
          const cor = STATUS_COR[status];
          const acesa = n > 0;
          const ultima = i === COLUNAS_KANBAN.length - 1;
          return (
            <Link
              key={status}
              href={`/ordens?status=${status}`}
              className="group flex shrink-0 flex-col items-center"
              style={{ width: 88 }}
            >
              <div className="flex w-full items-center">
                <span
                  className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full border font-mono text-[11px] font-bold transition-transform group-hover:scale-110 group-active:scale-95"
                  style={{
                    borderColor: acesa ? `rgb(${cor})` : "rgba(255,255,255,.14)",
                    color: acesa ? `rgb(${cor})` : "rgb(113 113 122)",
                    background: acesa ? `rgba(${cor}, .14)` : "rgba(255,255,255,.03)",
                    boxShadow: acesa ? `0 0 10px 1px rgba(${cor}, .45)` : "none",
                  }}
                >
                  {n}
                </span>
                {!ultima && (
                  <span
                    className="mx-0.5 h-[2px] flex-1"
                    style={{
                      backgroundImage: `repeating-linear-gradient(to right, ${
                        acesa ? `rgb(${cor})` : "rgba(255,255,255,.15)"
                      } 0 6px, transparent 6px 11px)`,
                      opacity: acesa ? 0.8 : 0.5,
                    }}
                  />
                )}
              </div>
              <span className="mt-2 text-center text-[9px] font-bold uppercase leading-tight tracking-wide text-zinc-500 group-hover:text-zinc-300">
                {STATUS_LABEL[status]}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
