"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import PainelVidro from "@/components/ui/PainelVidro";
import Campo from "@/components/ui/Campo";
import TrailPlateButton from "@/components/TrailPlateButton";
import CameraCaptura from "@/components/CameraCaptura";
import { DEMO, supabase } from "@/lib/supabase";

interface RespostaPeca {
  nome?: string;
  sku?: string;
  codigo_barras?: string;
  erro?: string;
}

interface FotoPeca {
  blob: Blob;
  url: string;
}

/**
 * Cadastro rápido de peça: só o essencial (nome, preço, quantidade),
 * com a opção de fotografar a etiqueta e deixar a Gemini tentar
 * preencher nome/código sozinha.
 */
export default function CadastroRapidoPage() {
  const router = useRouter();
  const [nome, setNome] = useState("");
  const [sku, setSku] = useState("");
  const [precoVenda, setPrecoVenda] = useState("");
  const [precoCusto, setPrecoCusto] = useState("");
  const [quantidade, setQuantidade] = useState("");
  const [abrindoCamera, setAbrindoCamera] = useState(false);
  const [lendo, setLendo] = useState(false);
  const [aviso, setAviso] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const [fotos, setFotos] = useState<FotoPeca[]>([]);

  const adicionarFoto = (blob: Blob) => {
    setFotos((atual) => [...atual, { blob, url: URL.createObjectURL(blob) }]);
  };

  const removerFoto = (indice: number) => {
    setFotos((atual) => {
      const copia = [...atual];
      const [removida] = copia.splice(indice, 1);
      if (removida) URL.revokeObjectURL(removida.url);
      return copia;
    });
  };

  const lerFotos = async (lista: FotoPeca[]) => {
    setAbrindoCamera(false);
    if (lista.length === 0) return;
    setLendo(true);
    setAviso("");
    try {
      const formData = new FormData();
      lista.forEach((f, i) => formData.append("imagem", f.blob, `peca-${i}.jpg`));
      formData.append("modo", "peca");
      const resposta = await fetch("/api/ler-imagem", { method: "POST", body: formData });
      const resultado: RespostaPeca = await resposta.json();
      if (!resposta.ok || resultado.erro) {
        setAviso(resultado.erro ?? "Não deu para ler as fotos. Preencha manualmente.");
        return;
      }
      if (resultado.nome) setNome(resultado.nome);
      if (resultado.sku || resultado.codigo_barras) setSku(resultado.sku ?? resultado.codigo_barras ?? "");
    } catch {
      setAviso("Não deu para ler as fotos agora. Preencha manualmente.");
    } finally {
      setLendo(false);
    }
  };

  const salvar = async () => {
    setSalvando(true);
    setErro("");
    try {
      if (DEMO || !supabase) {
        await new Promise((r) => setTimeout(r, 400));
        router.push("/estoque");
        return;
      }
      const { data: produto, error: eProduto } = await supabase
        .from("produtos")
        .insert({
          nome: nome.trim(),
          sku: sku.trim() || null,
          preco_venda: Number(precoVenda) || 0,
          preco_custo: Number(precoCusto) || 0,
        })
        .select("id")
        .single();
      if (eProduto) throw eProduto;

      if (Number(quantidade) > 0) {
        const { error: eMov } = await supabase.from("estoque_movimentos").insert({
          produto_id: produto.id,
          tipo: "entrada_manual",
          quantidade: Number(quantidade),
          custo_unit: Number(precoCusto) || null,
        });
        if (eMov) throw eMov;
      }
      router.push("/estoque");
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não foi possível salvar a peça.");
    } finally {
      setSalvando(false);
    }
  };

  if (abrindoCamera) {
    return (
      <CameraCaptura
        onFoto={adicionarFoto}
        onCancelar={() => setAbrindoCamera(false)}
        onConcluir={() => lerFotos(fotos)}
        titulo="Enquadre a peça"
        multiplo
        contagemAtual={fotos.length}
      />
    );
  }

  return (
    <div className="flex flex-col gap-6 pt-4">
      <div>
        <h1 className="font-display text-2xl uppercase tracking-wide text-zinc-50">Cadastro Rápido</h1>
        <p className="mt-1 text-sm text-zinc-400">Nome, preço, quantidade — o essencial pra peça já sair no estoque.</p>
      </div>

      <PainelVidro className="flex flex-col gap-4 p-5">
        {fotos.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {fotos.map((f, i) => (
              <div key={f.url} className="relative h-16 w-16 overflow-hidden rounded-lg border border-white/10">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={f.url} alt={`Foto ${i + 1} da peça`} className="h-full w-full object-cover" />
                <button
                  onClick={() => removerFoto(i)}
                  aria-label="Remover foto"
                  className="absolute right-0.5 top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-black/70 text-[10px] text-zinc-200"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
        <button
          onClick={() => setAbrindoCamera(true)}
          disabled={lendo}
          className="flex h-14 items-center justify-center gap-2 rounded-lg border border-dashed border-white/20 text-sm text-zinc-400 hover:text-zinc-200"
        >
          {lendo
            ? "Lendo fotos…"
            : fotos.length > 0
              ? `Tirar mais fotos (${fotos.length} até agora)`
              : "Fotografar a peça — pode tirar de vários ângulos"}
        </button>
        {aviso && <p className="text-xs text-amber-300">{aviso}</p>}

        <Campo label="Nome da peça" value={nome} onChange={setNome} placeholder="Pastilha de freio dianteira" />
        <div className="grid grid-cols-2 gap-3">
          <Campo label="Preço de venda" value={precoVenda} onChange={setPrecoVenda} placeholder="149,00" />
          <Campo label="Quantidade" value={quantidade} onChange={setQuantidade} placeholder="4" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Campo label="Preço de custo" value={precoCusto} onChange={setPrecoCusto} placeholder="78,00" />
          <Campo label="Código / SKU" value={sku} onChange={setSku} placeholder="PF-D01" />
        </div>
        {erro && <p className="text-sm text-red-400">{erro}</p>}
      </PainelVidro>

      <TrailPlateButton onClick={salvar} disabled={salvando || !nome} className="w-full">
        {salvando ? "Salvando…" : "Salvar peça"}
      </TrailPlateButton>
    </div>
  );
}
