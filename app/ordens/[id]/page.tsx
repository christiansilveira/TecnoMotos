"use client";

import { use, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import PainelVidro from "@/components/ui/PainelVidro";
import BadgeStatus from "@/components/ui/BadgeStatus";
import Campo from "@/components/ui/Campo";
import TrailPlateButton from "@/components/TrailPlateButton";
import AprovacaoOS from "@/components/AprovacaoOS";
import { RevealGroup, RevealItem } from "@/components/ui/Reveal";
import { DEMO, supabase } from "@/lib/supabase";
import { ORDENS_DEMO, ITENS_DEMO, PRODUTOS_DEMO } from "@/lib/dados-demo";
import {
  brl,
  COLUNAS_KANBAN,
  STATUS_COR,
  STATUS_LABEL,
  type ItemOS,
  type OrdemServico,
  type Produto,
  type StatusOS,
} from "@/lib/tipos";

const TODOS_STATUS: StatusOS[] = [...COLUNAS_KANBAN, "entregue"];

/** Soma os itens por tipo e devolve os três valores que a
 * ordens_servico guarda — é o que mantém o quadro de Ordens e o
 * Dashboard (que leem valor_total direto da tabela) sempre batendo
 * com o que está lançado aqui, sem precisar abrir a OS de novo. */
function somarItens(itens: ItemOS[], desconto: number) {
  const valor_pecas = itens.filter((i) => i.tipo === "peca").reduce((s, i) => s + i.quantidade * i.valor_unit, 0);
  const valor_servicos = itens.filter((i) => i.tipo === "servico").reduce((s, i) => s + i.quantidade * i.valor_unit, 0);
  const valor_total = Math.max(0, valor_pecas + valor_servicos - desconto);
  return { valor_pecas, valor_servicos, valor_total };
}

export default function PaginaOS({ params }: PageProps<"/ordens/[id]">) {
  const { id } = use(params);
  const [os, setOs] = useState<OrdemServico | null>(null);
  const [itens, setItens] = useState<ItemOS[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [erroCarregar, setErroCarregar] = useState("");
  const [statusSelecionado, setStatusSelecionado] = useState<StatusOS | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [salvo, setSalvo] = useState(false);

  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [formAberto, setFormAberto] = useState(false);
  const [tipoNovo, setTipoNovo] = useState<"peca" | "servico">("servico");
  const [produtoNovo, setProdutoNovo] = useState("");
  const [descricaoNovo, setDescricaoNovo] = useState("");
  const [quantidadeNovo, setQuantidadeNovo] = useState("1");
  const [valorNovo, setValorNovo] = useState("");
  const [adicionando, setAdicionando] = useState(false);
  const [erroItem, setErroItem] = useState("");

  const carregar = useCallback(async () => {
    if (DEMO || !supabase) {
      const encontrada = ORDENS_DEMO.find((o) => o.id === id) ?? null;
      setOs(encontrada);
      setStatusSelecionado(encontrada?.status ?? null);
      setItens(ITENS_DEMO.filter((i) => i.os_id === id));
      setCarregando(false);
      return;
    }
    setErroCarregar("");
    const { data, error: erroOS } = await supabase
      .from("ordens_servico")
      .select("*, veiculos(placa, marca, modelo, ano, fotos_url), clientes(nome, telefone)")
      .eq("id", id)
      .single();
    if (erroOS) {
      // Distingue "OS não existe" de "erro de verdade" (ex.: coluna que
      // ainda não existe porque um script SQL pendente não rodou) — sem
      // isso, qualquer erro de banco aparecia como "não encontrada",
      // o que é enganoso e difícil de diagnosticar.
      setErroCarregar(erroOS.message);
      setOs(null);
      setCarregando(false);
      return;
    }
    const encontrada = (data as unknown as OrdemServico) ?? null;
    setOs(encontrada);
    setStatusSelecionado(encontrada?.status ?? null);
    const { data: i, error: erroItens } = await supabase.from("os_itens").select("*").eq("os_id", id).order("criado_em");
    if (erroItens) setErroCarregar(erroItens.message);
    setItens((i as unknown as ItemOS[]) ?? []);
    setCarregando(false);
  }, [id]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  useEffect(() => {
    if (DEMO || !supabase) {
      setProdutos(PRODUTOS_DEMO);
      return;
    }
    supabase
      .from("vw_estoque")
      .select("*")
      .eq("ativo", true)
      .order("nome")
      .limit(300)
      .then(({ data }) => setProdutos((data as Produto[]) ?? []));
  }, []);

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

  const limparFormItem = () => {
    setProdutoNovo("");
    setDescricaoNovo("");
    setQuantidadeNovo("1");
    setValorNovo("");
    setErroItem("");
  };

  const escolherProduto = (produtoId: string) => {
    setProdutoNovo(produtoId);
    const p = produtos.find((x) => x.id === produtoId);
    if (p) {
      setDescricaoNovo(p.nome);
      setValorNovo(String(p.preco_venda));
    }
  };

  const adicionarItem = async () => {
    const quantidade = Number(quantidadeNovo.replace(",", "."));
    const valor_unit = Number(valorNovo.replace(",", "."));
    if (!descricaoNovo.trim()) {
      setErroItem("Descreva a peça ou o serviço.");
      return;
    }
    if (!quantidade || quantidade <= 0) {
      setErroItem("Quantidade precisa ser maior que zero.");
      return;
    }
    setAdicionando(true);
    setErroItem("");

    if (DEMO || !supabase) {
      await new Promise((r) => setTimeout(r, 300));
      const novo: ItemOS = {
        id: `demo-${Date.now()}`,
        os_id: id,
        tipo: tipoNovo,
        descricao: descricaoNovo.trim(),
        quantidade,
        valor_unit: valor_unit || 0,
      };
      const proximosItens = [...itens, novo];
      setItens(proximosItens);
      setOs((atual) => (atual ? { ...atual, ...somarItens(proximosItens, atual.valor_desconto) } : atual));
      setAdicionando(false);
      setFormAberto(false);
      limparFormItem();
      return;
    }

    const { error: eItem } = await supabase.from("os_itens").insert({
      os_id: id,
      tipo: tipoNovo,
      descricao: descricaoNovo.trim(),
      quantidade,
      valor_unit: valor_unit || 0,
    });
    if (eItem) {
      setErroItem(eItem.message);
      setAdicionando(false);
      return;
    }

    // Peça vinculada ao estoque: abate o saldo com um movimento
    // "saida_os" — não há coluna produto_id em os_itens, então esse
    // vínculo é só nesse instante (excluir o item depois não devolve
    // o estoque automaticamente).
    if (tipoNovo === "peca" && produtoNovo) {
      await supabase.from("estoque_movimentos").insert({
        produto_id: produtoNovo,
        tipo: "saida_os",
        quantidade,
      });
    }

    const proximosItens = [...itens, { id: "temp", os_id: id, tipo: tipoNovo, descricao: descricaoNovo.trim(), quantidade, valor_unit: valor_unit || 0 }];
    if (os) {
      await supabase.from("ordens_servico").update(somarItens(proximosItens, os.valor_desconto)).eq("id", id);
    }

    setAdicionando(false);
    setFormAberto(false);
    limparFormItem();
    carregar();
  };

  const removerItem = async (itemId: string) => {
    const restantes = itens.filter((i) => i.id !== itemId);
    if (DEMO || !supabase) {
      setItens(restantes);
      setOs((atual) => (atual ? { ...atual, ...somarItens(restantes, atual.valor_desconto) } : atual));
      return;
    }
    await supabase.from("os_itens").delete().eq("id", itemId);
    if (os) {
      await supabase.from("ordens_servico").update(somarItens(restantes, os.valor_desconto)).eq("id", id);
    }
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
        {erroCarregar ? (
          <>
            <p className="text-sm font-bold uppercase tracking-wide text-red-400">Erro ao carregar a OS</p>
            <p className="mx-auto mt-2 max-w-md rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
              {erroCarregar}
            </p>
            <p className="mt-3 text-xs text-zinc-500">
              Se a mensagem mencionar uma coluna que não existe (ex.: <code>fotos_url</code>), falta rodar o script{" "}
              <code>supabase/2026-09-17-fotos-da-moto.sql</code> no SQL Editor do Supabase.
            </p>
          </>
        ) : (
          <p className="text-sm text-zinc-400">Ordem de serviço não encontrada.</p>
        )}
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
        <PainelVidro corStatus={STATUS_COR[os.status]} className="p-5">
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
          {os.veiculos?.fotos_url && os.veiculos.fotos_url.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2 border-t border-white/5 pt-3">
              {os.veiculos.fotos_url.map((url, i) => (
                <a
                  key={url}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block h-16 w-16 overflow-hidden rounded-lg border border-white/10"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt={`Foto ${i + 1} da moto`} className="h-full w-full object-cover" />
                </a>
              ))}
            </div>
          )}
        </PainelVidro>
      </RevealItem>

      <RevealItem>
        <PainelVidro className="p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-display text-sm uppercase tracking-wide text-zinc-200">Itens e serviços</h2>
            {!formAberto && (
              <TrailPlateButton tamanho="sm" onClick={() => setFormAberto(true)}>
                + Adicionar
              </TrailPlateButton>
            )}
          </div>

          <div className="mt-3 divide-y divide-white/5">
            {itens.length === 0 && <p className="py-3 text-sm text-zinc-500">Nenhum item lançado.</p>}
            {itens.map((i) => (
              <div key={i.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                <div className="min-w-0 flex-1">
                  <span className="block truncate text-zinc-300">{i.descricao}</span>
                  <span className="text-[10px] uppercase tracking-wide text-zinc-600">
                    {i.tipo === "peca" ? "Peça" : "Serviço"} · {i.quantidade}x {brl(i.valor_unit)}
                  </span>
                </div>
                <span className="shrink-0 font-mono text-zinc-400">{brl(i.quantidade * i.valor_unit)}</span>
                <button
                  onClick={() => removerItem(i.id)}
                  aria-label="Remover item"
                  className="shrink-0 rounded-md border border-red-500/30 bg-red-500/10 px-2 py-1 text-xs font-bold text-red-400 transition-colors hover:bg-red-500/20"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>

          {formAberto && (
            <div className="mt-4 rounded-lg border border-white/10 bg-black/30 p-4">
              <div className="flex gap-1 rounded-full border border-white/10 bg-white/5 p-1">
                {(["servico", "peca"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => {
                      setTipoNovo(t);
                      setProdutoNovo("");
                    }}
                    className={`flex-1 rounded-full px-3 py-1.5 text-xs font-bold uppercase tracking-wide transition-colors ${
                      tipoNovo === t ? "bg-zinc-200 text-zinc-900" : "text-zinc-400 hover:text-zinc-200"
                    }`}
                  >
                    {t === "peca" ? "Peça" : "Serviço"}
                  </button>
                ))}
              </div>

              {tipoNovo === "peca" && (
                <label className="mt-3 block">
                  <span className="mb-2 block text-[11px] uppercase tracking-wide text-zinc-500">Produto do estoque</span>
                  <select
                    value={produtoNovo}
                    onChange={(e) => escolherProduto(e.target.value)}
                    className="campo-instrumento w-full rounded-md border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-zinc-100 outline-none"
                  >
                    <option value="">Descrição manual…</option>
                    {produtos.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nome} {p.saldo != null ? `(${p.saldo} un.)` : ""}
                      </option>
                    ))}
                  </select>
                </label>
              )}

              <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="col-span-2">
                  <Campo label="Descrição" value={descricaoNovo} onChange={setDescricaoNovo} placeholder="Ex.: Troca de óleo" />
                </div>
                <Campo label="Qtd." value={quantidadeNovo} onChange={setQuantidadeNovo} inputMode="decimal" />
                <Campo label="Valor unit. (R$)" value={valorNovo} onChange={setValorNovo} inputMode="decimal" placeholder="0,00" />
              </div>

              {erroItem && (
                <p className="mt-3 rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">
                  {erroItem}
                </p>
              )}

              <div className="mt-4 flex gap-2">
                <TrailPlateButton onClick={adicionarItem} disabled={adicionando} className="flex-1">
                  {adicionando ? "Lançando…" : "Lançar item"}
                </TrailPlateButton>
                <button
                  onClick={() => {
                    setFormAberto(false);
                    limparFormItem();
                  }}
                  className="rounded-md border border-white/10 px-4 text-xs font-bold uppercase tracking-wide text-zinc-400 hover:text-zinc-200"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}

          <div className="mt-3 flex items-center justify-between border-t border-white/10 pt-3">
            <span className="font-display text-sm uppercase text-zinc-200">Total</span>
            <span className="font-mono text-lg font-bold text-zinc-50">{brl(total)}</span>
          </div>

          <AprovacaoOS
            os={os}
            itens={itens}
            total={total}
            onStatusAtualizado={(novoStatus) => {
              setOs((atual) => (atual ? { ...atual, status: novoStatus } : atual));
              setStatusSelecionado(novoStatus);
            }}
          />
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

