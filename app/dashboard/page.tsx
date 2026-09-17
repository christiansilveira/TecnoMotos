"use client";

import { useEffect, useMemo, useState } from "react";
import PainelVidro from "@/components/ui/PainelVidro";
import TrancaDashboard from "@/components/ui/TrancaDashboard";
import { RevealGroup, RevealItem } from "@/components/ui/Reveal";
import { DEMO, supabase } from "@/lib/supabase";
import { ORDENS_DEMO } from "@/lib/dados-demo";
import { brl, COLUNAS_KANBAN, corStatusTexto, STATUS_COR, STATUS_LABEL, type OrdemServico } from "@/lib/tipos";
import { useBikerStore } from "@/store/useBikerStore";

export default function DashboardPage() {
  return (
    <TrancaDashboard>
      <ConteudoDashboard />
    </TrancaDashboard>
  );
}

function ConteudoDashboard() {
  const tema = useBikerStore((s) => s.tema);
  const [ordens, setOrdens] = useState<OrdemServico[] | null>(null);
  const [dias, setDias] = useState(30);

  useEffect(() => {
    let vivo = true;
    async function carregar() {
      if (DEMO || !supabase) {
        if (vivo) setOrdens(ORDENS_DEMO);
        return;
      }
      const { data } = await supabase
        .from("ordens_servico")
        .select("id, numero, status, valor_total, aberta_em, finalizada_em");
      if (vivo) setOrdens((data as unknown as OrdemServico[]) ?? []);
    }
    carregar();
    return () => {
      vivo = false;
    };
  }, []);

  const { abertas, porStatus, faturado, concluidas, ticket, novas } = useMemo(() => {
    const lista = ordens ?? [];
    const desdeMs = Date.now() - dias * 864e5;
    const abertasCalc = lista.filter((o) => !["entregue", "cancelado"].includes(o.status));
    const porStatusCalc = COLUNAS_KANBAN.concat(["entregue"])
      .map((s) => ({ status: s, quantidade: lista.filter((o) => o.status === s).length }))
      .filter((x) => x.quantidade > 0);
    const concluidasCalc = lista.filter((o) => o.finalizada_em && new Date(o.finalizada_em).getTime() >= desdeMs);
    const faturadoCalc = concluidasCalc.reduce((s, o) => s + (o.valor_total || 0), 0);
    const novasCalc = lista.filter((o) => new Date(o.aberta_em).getTime() >= desdeMs).length;
    return {
      abertas: abertasCalc,
      porStatus: porStatusCalc,
      faturado: faturadoCalc,
      concluidas: concluidasCalc,
      ticket: concluidasCalc.length ? faturadoCalc / concluidasCalc.length : 0,
      novas: novasCalc,
    };
  }, [ordens, dias]);

  const maiorStatus = Math.max(1, ...porStatus.map((s) => s.quantidade));

  return (
    <RevealGroup className="flex flex-col gap-6 pt-4">
      <h1 className="font-display text-2xl uppercase tracking-wide text-zinc-50">Dashboard</h1>

      <PainelVidro className="p-5">
        <h2 className="font-display text-sm uppercase tracking-wide text-zinc-200">Na oficina agora</h2>
        <p className="mt-1 text-xs text-zinc-500">
          {abertas.length} {abertas.length === 1 ? "ordem aberta" : "ordens abertas"}
        </p>
        <div className="mt-4 flex flex-col gap-3">
          {porStatus.map(({ status, quantidade }) => (
            <div key={status}>
              <div className="mb-1 flex justify-between text-xs uppercase tracking-wide">
                <span style={{ color: `rgb(${corStatusTexto(STATUS_COR[status], tema)})` }}>{STATUS_LABEL[status]}</span>
                <span className="font-mono text-zinc-300">{quantidade}</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${(quantidade / maiorStatus) * 100}%`, background: `rgb(${STATUS_COR[status]})` }}
                />
              </div>
            </div>
          ))}
        </div>
      </PainelVidro>

      <div className="flex gap-2">
        {[7, 30, 90].map((d) => (
          <button
            key={d}
            onClick={() => setDias(d)}
            className={`flex-1 rounded-lg border px-3 py-2 text-xs font-bold uppercase tracking-wide ${
              dias === d ? "border-zinc-200 bg-zinc-200 text-zinc-900" : "border-white/10 bg-white/5 text-zinc-400"
            }`}
          >
            {d} dias
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <RevealItem>
          <CartaoNumero destaque titulo="Faturado" valor={brl(faturado)} />
        </RevealItem>
        <RevealItem>
          <CartaoNumero titulo="OS finalizadas" valor={String(concluidas.length)} />
        </RevealItem>
        <RevealItem>
          <CartaoNumero titulo="OS abertas" valor={String(novas)} />
        </RevealItem>
        <RevealItem>
          <CartaoNumero titulo="Ticket médio" valor={brl(ticket)} />
        </RevealItem>
      </div>
    </RevealGroup>
  );
}

function CartaoNumero({ titulo, valor, destaque }: { titulo: string; valor: string; destaque?: boolean }) {
  return (
    <PainelVidro className={`p-4 ${destaque ? "bg-zinc-100/90 text-zinc-900" : ""}`}>
      <p className="font-mono text-xl font-bold">{valor}</p>
      <p className={`mt-1 text-[10px] uppercase tracking-wide ${destaque ? "text-zinc-700" : "text-zinc-500"}`}>{titulo}</p>
    </PainelVidro>
  );
}
