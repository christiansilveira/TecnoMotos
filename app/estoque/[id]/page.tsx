"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import PainelVidro from "@/components/ui/PainelVidro";
import Campo from "@/components/ui/Campo";
import TrailPlateButton from "@/components/TrailPlateButton";
import { DEMO, supabase } from "@/lib/supabase";
import { PRODUTOS_DEMO } from "@/lib/dados-demo";
import { brl, type Produto } from "@/lib/tipos";

/**
 * Editar/excluir peça — faltava qualquer jeito de corrigir um cadastro
 * ou tirar uma peça descontinuada da lista sem mexer direto no banco.
 * Exclusão é sempre soft-delete (ativo=false): a peça pode já estar
 * referenciada em OS antigas ou em estoque_movimentos, então apagar de
 * verdade quebraria o histórico — "excluir" aqui quer dizer "some da
 * lista ativa", não "apaga pra sempre".
 */
export default function EditarProdutoPage({ params }: PageProps<"/estoque/[id]">) {
  const { id } = use(params);
  const router = useRouter();

  const [produto, setProduto] = useState<Produto | null>(null);
  const [carregando, setCarregando] = useState(true);

  const [nome, setNome] = useState("");
  const [sku, setSku] = useState("");
  const [precoVenda, setPrecoVenda] = useState("");
  const [precoCusto, setPrecoCusto] = useState("");
  const [estoqueMin, setEstoqueMin] = useState("");
  const [unidade, setUnidade] = useState("un");

  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const [salvo, setSalvo] = useState(false);
  const [confirmandoExclusao, setConfirmandoExclusao] = useState(false);
  const [excluindo, setExcluindo] = useState(false);

  useEffect(() => {
    const preencher = (p: Produto) => {
      setProduto(p);
      setNome(p.nome);
      setSku(p.sku ?? "");
      setPrecoVenda(String(p.preco_venda));
      setPrecoCusto(String(p.preco_custo));
      setEstoqueMin(String(p.estoque_min ?? 0));
      setUnidade(p.unidade ?? "un");
    };

    if (DEMO || !supabase) {
      const encontrado = PRODUTOS_DEMO.find((p) => p.id === id) ?? null;
      if (encontrado) preencher(encontrado);
      setCarregando(false);
      return;
    }
    supabase
      .from("vw_estoque")
      .select("*")
      .eq("id", id)
      .single()
      .then(({ data }) => {
        if (data) preencher(data as Produto);
        setCarregando(false);
      });
  }, [id]);

  const salvar = async () => {
    if (!nome.trim()) {
      setErro("Dê um nome pra peça.");
      return;
    }
    setSalvando(true);
    setErro("");
    const alteracoes = {
      nome: nome.trim(),
      sku: sku.trim() || null,
      preco_venda: Number(precoVenda.replace(",", ".")) || 0,
      preco_custo: Number(precoCusto.replace(",", ".")) || 0,
      estoque_min: Number(estoqueMin.replace(",", ".")) || 0,
      unidade: unidade.trim() || "un",
    };

    if (DEMO || !supabase) {
      await new Promise((r) => setTimeout(r, 350));
      setSalvando(false);
      setSalvo(true);
      setTimeout(() => setSalvo(false), 2000);
      return;
    }

    const { error } = await supabase.from("produtos").update(alteracoes).eq("id", id);
    setSalvando(false);
    if (error) {
      setErro(error.message);
      return;
    }
    setSalvo(true);
    setTimeout(() => setSalvo(false), 2000);
  };

  const excluir = async () => {
    setExcluindo(true);
    if (DEMO || !supabase) {
      await new Promise((r) => setTimeout(r, 350));
      router.push("/estoque");
      return;
    }
    const { error } = await supabase.from("produtos").update({ ativo: false }).eq("id", id);
    setExcluindo(false);
    if (error) {
      setErro(error.message);
      return;
    }
    router.push("/estoque");
  };

  if (carregando) {
    return (
      <div className="pt-4">
        <div className="h-8 w-40 animate-pulse rounded bg-white/5" />
        <div className="mt-4 h-64 animate-pulse rounded-xl bg-white/5" />
      </div>
    );
  }

  if (!produto) {
    return (
      <PainelVidro className="mt-4 p-8 text-center">
        <p className="text-sm text-zinc-400">Peça não encontrada.</p>
        <Link href="/estoque" className="mt-3 inline-block text-sm text-zinc-200 underline">
          Voltar para o estoque
        </Link>
      </PainelVidro>
    );
  }

  return (
    <div className="flex flex-col gap-6 pt-4">
      <Link href="/estoque" className="w-fit text-xs uppercase tracking-wide text-zinc-500 hover:text-zinc-300">
        ← Voltar para Estoque
      </Link>

      <div>
        <h1 className="font-display text-2xl uppercase tracking-wide text-zinc-50">Editar peça</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Saldo atual: <span className="font-mono text-zinc-200">{produto.saldo}</span> {produto.unidade} · valor em
          estoque {brl(produto.saldo * produto.preco_custo)}
        </p>
      </div>

      <PainelVidro className="flex flex-col gap-4 p-5">
        <Campo label="Nome da peça" value={nome} onChange={setNome} />
        <div className="grid grid-cols-2 gap-3">
          <Campo label="Preço de venda" value={precoVenda} onChange={setPrecoVenda} inputMode="decimal" />
          <Campo label="Preço de custo" value={precoCusto} onChange={setPrecoCusto} inputMode="decimal" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Campo label="Código / SKU" value={sku} onChange={setSku} />
          <Campo label="Unidade" value={unidade} onChange={setUnidade} placeholder="un" />
        </div>
        <Campo
          label="Estoque mínimo (alerta de reposição)"
          value={estoqueMin}
          onChange={setEstoqueMin}
          inputMode="decimal"
        />
        {erro && <p className="text-sm text-red-400">{erro}</p>}
        {salvo && <p className="text-sm text-emerald-400">Peça atualizada.</p>}
      </PainelVidro>

      <TrailPlateButton onClick={salvar} disabled={salvando} className="w-full">
        {salvando ? "Salvando…" : "Salvar alterações"}
      </TrailPlateButton>

      <PainelVidro className="flex flex-col gap-3 p-5" style={{ borderColor: "rgba(248,113,113,.25)" }}>
        <p className="text-xs uppercase tracking-wide text-zinc-500">Zona de exclusão</p>
        {!confirmandoExclusao ? (
          <TrailPlateButton
            tamanho="sm"
            variante="perigo"
            onClick={() => setConfirmandoExclusao(true)}
            className="w-fit"
          >
            Excluir peça
          </TrailPlateButton>
        ) : (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-zinc-300">
              A peça some da lista do estoque, mas fica preservada no histórico de OS e movimentações. Confirma?
            </p>
            <div className="flex gap-2">
              <TrailPlateButton variante="perigo" onClick={excluir} disabled={excluindo}>
                {excluindo ? "Excluindo…" : "Sim, excluir"}
              </TrailPlateButton>
              <button
                onClick={() => setConfirmandoExclusao(false)}
                className="rounded-md border border-white/10 px-4 text-xs font-bold uppercase tracking-wide text-zinc-400 hover:text-zinc-200"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </PainelVidro>
    </div>
  );
}
