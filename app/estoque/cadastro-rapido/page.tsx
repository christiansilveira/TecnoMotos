"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import PainelVidro from "@/components/ui/PainelVidro";
import TrailPlateButton from "@/components/TrailPlateButton";
import CameraCaptura from "@/components/CameraCaptura";
import { DEMO, supabase } from "@/lib/supabase";

interface RespostaPeca {
  nome?: string;
  sku?: string;
  codigo_barras?: string;
  erro?: string;
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

  const lerEtiqueta = async (blob: Blob) => {
    setAbrindoCamera(false);
    setLendo(true);
    setAviso("");
    try {
      const formData = new FormData();
      formData.append("imagem", blob, "etiqueta.jpg");
      formData.append("modo", "peca");
      const resposta = await fetch("/api/ler-imagem", { method: "POST", body: formData });
      const resultado: RespostaPeca = await resposta.json();
      if (!resposta.ok || resultado.erro) {
        setAviso(resultado.erro ?? "Não deu para ler a etiqueta. Preencha manualmente.");
        return;
      }
      if (resultado.nome) setNome(resultado.nome);
      if (resultado.sku || resultado.codigo_barras) setSku(resultado.sku ?? resultado.codigo_barras ?? "");
    } catch {
      setAviso("Não deu para ler a etiqueta agora. Preencha manualmente.");
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
    return <CameraCaptura onFoto={lerEtiqueta} onCancelar={() => setAbrindoCamera(false)} titulo="Enquadre a etiqueta" />;
  }

  return (
    <div className="flex flex-col gap-6 pt-4">
      <div>
        <h1 className="font-display text-2xl uppercase tracking-wide text-zinc-50">Cadastro Rápido</h1>
        <p className="mt-1 text-sm text-zinc-400">Nome, preço, quantidade — o essencial pra peça já sair no estoque.</p>
      </div>

      <PainelVidro className="flex flex-col gap-4 p-5">
        <button
          onClick={() => setAbrindoCamera(true)}
          disabled={lendo}
          className="flex h-14 items-center justify-center gap-2 rounded-lg border border-dashed border-white/20 text-sm text-zinc-400 hover:text-zinc-200"
        >
          {lendo ? "Lendo etiqueta…" : "Ler etiqueta com a câmera"}
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

function Campo({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-[11px] uppercase tracking-wide text-zinc-500">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-zinc-400"
      />
    </label>
  );
}
