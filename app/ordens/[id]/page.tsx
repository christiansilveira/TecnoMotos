"use client";

import { use, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import PainelVidro from "@/components/ui/PainelVidro";
import BadgeStatus from "@/components/ui/BadgeStatus";
import TrailPlateButton from "@/components/TrailPlateButton";
import { RevealGroup, RevealItem } from "@/components/ui/Reveal";
import { DEMO, supabase } from "@/lib/supabase";
import { ORDENS_DEMO, ITENS_DEMO } from "@/lib/dados-demo";
import { brl, COLUNAS_KANBAN, STATUS_LABEL, type ItemOS, type OrdemServico, type StatusOS } from "@/lib/tipos";

const TODOS_STATUS: StatusOS[] = [...COLUNAS_KANBAN, "entregue"];

export default function PaginaOS({ params }: PageProps<"/ordens/[id]">) {
  const { id } = use(params);
  const [os, setOs] = useState<OrdemServico | null>(null);
  const [itens, setItens] = useState<ItemOS[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [statusSelecionado, setStatusSelecionado] = useState<StatusOS | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [salvo, setSalvo] = useState(false);

  const carregar = useCallback(async () => {
    if (DEMO || !supabase) {
      const encontrada = ORDENS_DEMO.find((o) => o.id === id) ?? null;
      setOs(encontrada);
      setStatusSelecionado(encontrada?.status ?? null);
      setItens(ITENS_DEMO.filter((i) => i.os_id === id));
      setCarregando(false);
      return;
    }
    const { data } = await supabase
      .from("ordens_servico")
      .select("*, veiculos(placa, marca, modelo, ano), clientes(nome, telefone)")
      .eq("id", id)
      .single();
    const encontrada = (data as unknown as OrdemServico) ?? null;
    setOs(encontrada);
    setStatusSelecionado(encontrada?.status ?? null);
    const { data: i } = await supabase.from("os_itens").select("*").eq("os_id", id).order("criado_em");
    setItens((i as unknown as ItemOS[]) ?? []);
    setCarregando(false);
  }, [id]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const salvarStatus = async () => {
    if (!statusSelecionado) return;
    setSalvando(true);
    setErro("");
    if (DEMO || !supabase) {
      await new Promise((r) => setTimeout(r, 350));
      setOs((atual) => (atual ? { ...atual, status: statusSelecionado } : atual));
      setSalvando(false);
      setSalvo(true);
      setTimeout(() => setSalvo(false), 2000);
      return;
    }
    const { error } = await supabase.from("ordens_servico").update({ status: statusSelecionado }).eq("id", id);
    setSalvando(false);
    if (error) {
      setErro(error.message);
      return;
    }
    setSalvo(true);
    setTimeout(() => setSalvo(false), 2000);
    carregar();
  };

  if (carregando) {
    return (
      <div className="pt-4">
        <div className="h-8 w-40 animate-pulse rounded bg-white/5" />
        <div className="mt-4 h-40 animate-pulse rounded-xl bg-white/5" />
      </div>
    );
  }

  if (!os) {
    return (
      <PainelVidro className="mt-4 p-8 text-center">
        <p className="text-sm text-zinc-400">Ordem de serviço não encontrada.</p>
        <Link href="/ordens" className="mt-3 inline-block text-sm text-zinc-200 underline">
          Voltar para o quadro
        </Link>
      </PainelVidro>
    );
  }

  const total = itens.reduce((soma, i) => soma + i.quantidade * i.valor_unit, 0) || os.valor_total;
  const statusMudou = statusSelecionado !== null && statusSelecionado !== os.status;

  return (
    <RevealGroup className="flex flex-col gap-6 pt-4">
      <Link href="/ordens" className="w-fit text-xs uppercase tracking-wide text-zinc-500 hover:text-zinc-300">
        ← Voltar para Ordens
      </Link>

      <RevealItem className="flex items-center justify-between">
        <h1 className="font-mono text-2xl font-bold text-zinc-50">OS {String(os.numero).padStart(4, "0")}</h1>
        <BadgeStatus status={os.status} tamanho="md" />
      </RevealItem>

      <RevealItem>
        <PainelVidro className="p-5">
          <p className="text-sm font-medium text-zinc-100">{os.clientes?.nome ?? "Sem cliente"}</p>
          <p className="text-xs text-zinc-500">
            {[os.veiculos?.marca, os.veiculos?.modelo, os.veiculos?.ano].filter(Boolean).join(" ")} · {os.veiculos?.placa}
          </p>
          {os.km_entrada && <p className="mt-1 text-xs text-zinc-500">{os.km_entrada.toLocaleString("pt-BR")} km na entrada</p>}
          {os.relato_cliente && (
            <p className="mt-3 text-sm text-zinc-300">
              <span className="text-zinc-500">Reclamação: </span>
              {os.relato_cliente}
            </p>
          )}
          {os.diagnostico && (
            <p className="mt-2 text-sm text-zinc-300">
              <span className="text-zinc-500">Diagnóstico: </span>
              {os.diagnostico}
            </p>
          )}
        </PainelVidro>
      </RevealItem>

      <RevealItem>
        <PainelVidro className="p-5">
          <h2 className="font-display text-sm uppercase tracking-wide text-zinc-200">Itens e serviços</h2>
          <div className="mt-3 divide-y divide-white/5">
            {itens.length === 0 && <p className="py-3 text-sm text-zinc-500">Nenhum item lançado.</p>}
            {itens.map((i) => (
              <div key={i.id} className="flex items-center justify-between py-2.5 text-sm">
                <span className="text-zinc-300">{i.descricao}</span>
                <span className="font-mono text-zinc-400">{brl(i.quantidade * i.valor_unit)}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-white/10 pt-3">
            <span className="font-display text-sm uppercase text-zinc-200">Total</span>
            <span className="font-mono text-lg font-bold text-zinc-50">{brl(total)}</span>
          </div>
        </PainelVidro>
      </RevealItem>

      <RevealItem>
        <PainelVidro className="p-5">
          <h2 className="font-display text-sm uppercase tracking-wide text-zinc-200">Situação</h2>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {TODOS_STATUS.map((s) => (
              <button
                key={s}
                onClick={() => setStatusSelecionado(s)}
                className={`rounded-lg border px-3 py-2.5 text-xs font-bold uppercase tracking-wide transition-colors ${
                  statusSelecionado === s
                    ? "border-zinc-200 bg-zinc-200 text-zinc-900"
                    : "border-white/10 bg-white/5 text-zinc-400 hover:text-zinc-200"
                }`}
              >
                {STATUS_LABEL[s]}
              </button>
            ))}
          </div>

          {statusMudou && (
            <div className="mt-4">
              <TrailPlateButton onClick={salvarStatus} disabled={salvando} className="w-full">
                {salvando ? "Salvando…" : `Salvar → ${STATUS_LABEL[statusSelecionado as StatusOS]}`}
              </TrailPlateButton>
            </div>
          )}
          {salvo && <p className="mt-3 text-sm text-emerald-400">Situação salva.</p>}
          {erro && <p className="mt-3 text-sm text-red-400">{erro}</p>}
        </PainelVidro>
      </RevealItem>
    </RevealGroup>
  );
}

