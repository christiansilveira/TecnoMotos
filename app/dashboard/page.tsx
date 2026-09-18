"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import PainelVidro from "@/components/ui/PainelVidro";
import TrancaDashboard from "@/components/ui/TrancaDashboard";
import { RevealGroup, RevealItem } from "@/components/ui/Reveal";
import { DEMO, supabase } from "@/lib/supabase";
import { ORDENS_DEMO, MOVIMENTOS_DEMO } from "@/lib/dados-demo";
import {
  brl,
  COLUNAS_KANBAN,
  corStatusTexto,
  STATUS_COR,
  STATUS_LABEL,
  type MovimentoEstoque,
  type OrdemServico,
} from "@/lib/tipos";
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
  const [movimentos, setMovimentos] = useState<MovimentoEstoque[] | null>(null);
  const [dias, setDias] = useState(30);

  useEffect(() => {
    let vivo = true;
    async function carregar() {
      if (DEMO || !supabase) {
        if (vivo) {
          setOrdens(ORDENS_DEMO);
          setMovimentos(MOVIMENTOS_DEMO);
        }
        return;
      }
      const { data } = await supabase
        .from("ordens_servico")
        .select("id, numero, status, valor_total, aberta_em, finalizada_em, entregue_em");
      if (vivo) setOrdens((data as unknown as OrdemServico[]) ?? []);

      // Peças que saíram: só os movimentos "saida_os" (baixados ao lançar
      // uma peça numa OS — ver app/ordens/[id]/page.tsx) contam pro
      // Dashboard. Melhor esforço: se o join com `produtos` falhar por
      // qualquer motivo, cai pra consulta sem o nome (mostra "Peça
      // sem cadastro" no ranking em vez de perder o número principal).
      const { data: movs, error: eMovs } = await supabase
        .from("estoque_movimentos")
        .select("id, produto_id, tipo, quantidade, criado_em, produtos(nome)")
        .eq("tipo", "saida_os");
      if (!eMovs) {
        if (vivo) setMovimentos((movs as unknown as MovimentoEstoque[]) ?? []);
      } else {
        const { data: movsSimples } = await supabase
          .from("estoque_movimentos")
          .select("id, produto_id, tipo, quantidade, criado_em")
          .eq("tipo", "saida_os");
        if (vivo) setMovimentos((movsSimples as unknown as MovimentoEstoque[]) ?? []);
      }
    }
    carregar();
    return () => {
      vivo = false;
    };
  }, []);

  const { abertas, porStatus, faturado, realizadas, entregues, ticket, pecasQtd, pecasRanking, tempoMedioDias } =
    useMemo(() => {
      const lista = ordens ?? [];
      const desdeMs = Date.now() - dias * 864e5;
      const abertasCalc = lista.filter((o) => !["entregue", "cancelado"].includes(o.status));
      const porStatusCalc = COLUNAS_KANBAN.concat(["entregue"])
        .map((s) => ({ status: s, quantidade: lista.filter((o) => o.status === s).length }))
        .filter((x) => x.quantidade > 0);

      // OS realizadas: finalizada ou entregue, contada pela data em que
      // ficou pronta (finalizada_em) dentro do período — é essa data que
      // alimenta faturamento e ticket médio (antes deste ajuste, ela
      // nunca era gravada fora dos dados de demonstração, então esses
      // números sempre voltavam zerados).
      const realizadasCalc = lista.filter(
        (o) => ["finalizado", "entregue"].includes(o.status) && o.finalizada_em && new Date(o.finalizada_em).getTime() >= desdeMs,
      );
      const faturadoCalc = realizadasCalc.reduce((s, o) => s + (o.valor_total || 0), 0);

      // OS entregues: a moto já saiu da oficina — métrica própria, à
      // parte de "realizadas", porque uma OS pode ficar finalizada dias
      // antes de o cliente efetivamente retirar a moto.
      const entreguesCalc = lista.filter(
        (o) => o.status === "entregue" && o.entregue_em && new Date(o.entregue_em).getTime() >= desdeMs,
      );

      const tempos = realizadasCalc
        .filter((o) => o.finalizada_em)
        .map((o) => (new Date(o.finalizada_em as string).getTime() - new Date(o.aberta_em).getTime()) / 864e5);
      const tempoMedioDiasCalc = tempos.length ? tempos.reduce((s, t) => s + t, 0) / tempos.length : 0;

      const movimentosPeriodo = (movimentos ?? []).filter((m) => new Date(m.criado_em).getTime() >= desdeMs);
      const pecasQtdCalc = movimentosPeriodo.reduce((s, m) => s + m.quantidade, 0);
      const porProduto = new Map<string, { produtoId: string; nome: string; quantidade: number }>();
      for (const m of movimentosPeriodo) {
        const produtosRel = m.produtos as unknown;
        const nome =
          (Array.isArray(produtosRel) ? produtosRel[0]?.nome : (produtosRel as { nome?: string } | null)?.nome) ??
          "Peça sem cadastro";
        const atual = porProduto.get(m.produto_id) ?? { produtoId: m.produto_id, nome, quantidade: 0 };
        atual.quantidade += m.quantidade;
        porProduto.set(m.produto_id, atual);
      }
      const pecasRankingCalc = [...porProduto.values()].sort((a, b) => b.quantidade - a.quantidade).slice(0, 5);

      return {
        abertas: abertasCalc,
        porStatus: porStatusCalc,
        faturado: faturadoCalc,
        realizadas: realizadasCalc,
        entregues: entreguesCalc,
        ticket: realizadasCalc.length ? faturadoCalc / realizadasCalc.length : 0,
        pecasQtd: pecasQtdCalc,
        pecasRanking: pecasRankingCalc,
        tempoMedioDias: tempoMedioDiasCalc,
      };
    }, [ordens, movimentos, dias]);

  const maiorStatus = Math.max(1, ...porStatus.map((s) => s.quantidade));
  const maiorPeca = Math.max(1, ...pecasRanking.map((p) => p.quantidade));

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
          <CartaoNumero titulo="Ticket médio" valor={brl(ticket)} />
        </RevealItem>
        <RevealItem>
          <CartaoNumero titulo="OS realizadas" valor={String(realizadas.length)} />
        </RevealItem>
        <RevealItem>
          <CartaoNumero titulo="OS entregues" valor={String(entregues.length)} href="/ordens?status=entregue" />
        </RevealItem>
        <RevealItem>
          <CartaoNumero titulo="Peças que saíram" valor={pecasQtd.toLocaleString("pt-BR")} />
        </RevealItem>
        <RevealItem>
          <CartaoNumero
            titulo="Tempo médio de execução"
            valor={tempoMedioDias ? `${tempoMedioDias.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}d` : "—"}
          />
        </RevealItem>
      </div>

      {pecasRanking.length > 0 && (
        <RevealItem>
          <PainelVidro className="p-5" corStatus="255 199 0">
            <h2 className="font-display text-sm uppercase tracking-wide text-zinc-200">Peças mais usadas</h2>
            <p className="mt-1 text-xs text-zinc-500">No período selecionado, por quantidade saída em OS.</p>
            <div className="mt-4 flex flex-col gap-3">
              {pecasRanking.map((p) => (
                <div key={p.produtoId}>
                  <div className="mb-1 flex justify-between gap-2 text-xs">
                    <span className="truncate text-zinc-300">{p.nome}</span>
                    <span className="font-mono text-zinc-400">{p.quantidade}</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-amber-400"
                      style={{ width: `${(p.quantidade / maiorPeca) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </PainelVidro>
        </RevealItem>
      )}
    </RevealGroup>
  );
}

function CartaoNumero({
  titulo,
  valor,
  destaque,
  href,
}: {
  titulo: string;
  valor: string;
  destaque?: boolean;
  /** Quando presente, o cartão inteiro vira um link — usado em "OS
   * entregues" pra levar direto pro filtro correspondente em /ordens
   * (Christian: "não consegui acessar as OS de entregues" — o número
   * sozinho, sem nenhum jeito de abrir a lista por trás dele, não
   * ajudava). */
  href?: string;
}) {
  // `.vidro-garagem` (globals.css) grava o próprio `background` fora de
  // qualquer @layer do Tailwind — numa cascata de layers isso sempre
  // vence uma utility class normal tipo `bg-zinc-100/90`, não importa a
  // ordem das classes. Resultado real (visto no Dashboard): o cartão de
  // destaque ficava com fundo escuro do `.vidro-garagem` por baixo do
  // texto escuro (`text-zinc-900`) pensado pra fundo claro — o número
  // mais importante do Dashboard (faturamento) quase ilegível. Inline
  // style tem prioridade sobre qualquer classe, então é o jeito
  // garantido de vencer essa cascata.
  const conteudo = (
    <PainelVidro
      className={`p-4 ${href ? "transition-transform hover:-translate-y-0.5 active:scale-[.99]" : ""}`}
      style={destaque ? { background: "rgba(244, 244, 245, 0.9)", color: "#18181b" } : undefined}
    >
      <p className="font-mono text-xl font-bold">{valor}</p>
      <p className={`mt-1 text-[10px] uppercase tracking-wide ${destaque ? "" : "text-zinc-500"}`} style={destaque ? { color: "#3f3f46" } : undefined}>
        {titulo}
      </p>
    </PainelVidro>
  );
  return href ? <Link href={href}>{conteudo}</Link> : conteudo;
}
