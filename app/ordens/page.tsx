"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import PainelVidro from "@/components/ui/PainelVidro";
import BadgeStatus from "@/components/ui/BadgeStatus";
import { RevealGroup, RevealItem } from "@/components/ui/Reveal";
import { DEMO, supabase } from "@/lib/supabase";
import { ORDENS_DEMO } from "@/lib/dados-demo";
import { brl, COLUNAS_KANBAN, STATUS_COR, STATUS_LABEL, urgencia, type OrdemServico, type StatusOS } from "@/lib/tipos";

const SELECAO =
  "id, numero, status, valor_total, aberta_em, finalizada_em, entregue_em, valor_pecas, valor_servicos, valor_desconto, relato_cliente, diagnostico, km_entrada, veiculo_id, cliente_id, veiculos(placa, marca, modelo, ano), clientes(nome, telefone)";

const STATUS_VALIDOS = new Set<string>(COLUNAS_KANBAN);

export default function OrdensPage() {
  return (
    <Suspense fallback={<EsqueletoLista />}>
      <OrdensPageConteudo />
    </Suspense>
  );
}

function OrdensPageConteudo() {
  const searchParams = useSearchParams();
  const statusUrl = searchParams.get("status");
  const [ordens, setOrdens] = useState<OrdemServico[] | null>(null);
  const [filtro, setFiltro] = useState<StatusOS | "todas">(
    statusUrl && STATUS_VALIDOS.has(statusUrl) ? (statusUrl as StatusOS) : "todas"
  );

  const carregar = useCallback(async () => {
    if (DEMO || !supabase) {
      setOrdens(ORDENS_DEMO);
      return;
    }
    const { data } = await supabase
      .from("ordens_servico")
      .select(SELECAO)
      .not("status", "in", "(entregue,cancelado)")
      .order("aberta_em", { ascending: false })
      .limit(150);
    setOrdens((data as unknown as OrdemServico[]) ?? []);
  }, []);

  useEffect(() => {
    carregar();
    if (DEMO || !supabase) return;
    const cliente = supabase;
    const canal = cliente
      .channel("ordens-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "ordens_servico" }, carregar)
      .subscribe();
    return () => {
      cliente.removeChannel(canal);
    };
  }, [carregar]);

  const visiveis = useMemo(() => {
    if (!ordens) return [];
    return filtro === "todas" ? ordens : ordens.filter((o) => o.status === filtro);
  }, [ordens, filtro]);

  const contar = (status: StatusOS) => (ordens ?? []).filter((o) => o.status === status).length;

  return (
    <div className="flex flex-col gap-6 pt-4">
      <div>
        <h1 className="font-display text-2xl uppercase tracking-wide text-zinc-50">Ordens de Serviço</h1>
        <p className="mt-1 text-sm text-zinc-400">{ordens?.length ?? "…"} ordens em aberto</p>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        <BotaoFiltro ativo={filtro === "todas"} onClick={() => setFiltro("todas")}>
          Todas {ordens ? `(${ordens.length})` : ""}
        </BotaoFiltro>
        {COLUNAS_KANBAN.map((s) => (
          <BotaoFiltro key={s} ativo={filtro === s} onClick={() => setFiltro(s)}>
            {STATUS_LABEL[s]} {ordens ? `(${contar(s)})` : ""}
          </BotaoFiltro>
        ))}
      </div>

      {!ordens ? (
        <EsqueletoLista />
      ) : visiveis.length === 0 ? (
        <PainelVidro className="p-8 text-center text-sm text-zinc-400">Nenhuma OS neste filtro.</PainelVidro>
      ) : (
        <RevealGroup className="grid gap-3">
          {visiveis.map((os) => (
            <RevealItem key={os.id}>
              <Link href={`/ordens/${os.id}`}>
                <PainelVidro
                  corStatus={STATUS_COR[os.status]}
                  className="p-4 pl-5 transition-transform hover:-translate-y-0.5 active:scale-[.99]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="font-mono text-sm font-bold text-zinc-100">
                      OS {String(os.numero).padStart(4, "0")}
                    </span>
                    <IndicadorUrgencia nivel={urgencia(os)} />
                  </div>
                  <p className="mt-2 text-sm font-medium text-zinc-100">
                    {os.clientes?.nome ?? "Sem cliente"} · {os.veiculos?.placa}
                  </p>
                  <p className="text-xs text-zinc-500">
                    {[os.veiculos?.marca, os.veiculos?.modelo].filter(Boolean).join(" ") || "—"}
                  </p>
                  <div className="mt-3 flex items-center justify-between border-t border-white/5 pt-3">
                    <BadgeStatus status={os.status} />
                    <span className="font-mono text-sm font-bold text-zinc-100">{brl(os.valor_total)}</span>
                  </div>
                </PainelVidro>
              </Link>
            </RevealItem>
          ))}
        </RevealGroup>
      )}
    </div>
  );
}

function BotaoFiltro({ ativo, onClick, children }: { ativo: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 rounded-full border px-4 py-2 text-xs font-bold uppercase tracking-wide transition-colors ${
        ativo
          ? "border-zinc-200 bg-zinc-200 text-zinc-900"
          : "border-white/10 bg-white/5 text-zinc-400 hover:text-zinc-200"
      }`}
    >
      {children}
    </button>
  );
}

function IndicadorUrgencia({ nivel }: { nivel: 0 | 1 | 2 | 3 }) {
  if (!nivel) return null;
  const cor = nivel === 3 ? "248 113 113" : nivel === 2 ? "251 146 60" : "161 161 170";
  const rotulo = nivel === 3 ? "Atrasado" : nivel === 2 ? "Atenção" : "No prazo";
  return (
    <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide" style={{ color: `rgb(${cor})` }}>
      <span className={`h-1.5 w-1.5 rounded-full ${nivel >= 2 ? "animate-pulse" : ""}`} style={{ background: `rgb(${cor})` }} />
      {rotulo}
    </span>
  );
}

function EsqueletoLista() {
  return (
    <div className="grid gap-3">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="h-24 animate-pulse rounded-xl border border-white/5 bg-white/5" style={{ animationDelay: `${i * 90}ms` }} />
      ))}
    </div>
  );
}
