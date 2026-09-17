"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import PainelVidro from "@/components/ui/PainelVidro";
import TrailPlateButton from "@/components/TrailPlateButton";
import CameraCaptura from "@/components/CameraCaptura";
import { DEMO, supabase } from "@/lib/supabase";

interface ItemNota {
  descricaoNf: string;
  codigoFornecedor: string | null;
  codigoBarras: string | null;
  ncm: string | null;
  quantidade: number;
  valorUnit: number;
  importar: boolean;
}

interface NotaLida {
  numero: string | null;
  serie: string | null;
  fornecedor: string | null;
  valorTotal: number;
  itens: ItemNota[];
}

interface ItemNotaLidaPorFoto {
  descricao?: string;
  codigoBarras?: string | null;
  quantidade?: number;
  valorUnit?: number;
}

interface RespostaNotaPorFoto {
  numero?: string | null;
  serie?: string | null;
  fornecedor?: string | null;
  valorTotal?: number;
  itens?: ItemNotaLidaPorFoto[];
  erro?: string;
}

/**
 * Leitura de nota de entrada por XML de NF-e. Isso é 100% client-side
 * (o navegador já sabe interpretar XML) — diferente da leitura de
 * placa/etiqueta por câmera, não depende de nenhuma API de IA externa,
 * então já sai funcionando de verdade nesta versão.
 */
export default function ImportarNotaPage() {
  const router = useRouter();
  const [nota, setNota] = useState<NotaLida | null>(null);
  const [erro, setErro] = useState("");
  const [importando, setImportando] = useState(false);
  const [abrindoCamera, setAbrindoCamera] = useState(false);
  const [fotosNota, setFotosNota] = useState<Blob[]>([]);
  const [lendoFoto, setLendoFoto] = useState(false);

  const lerArquivo = async (arquivo: File) => {
    setErro("");
    try {
      const texto = await arquivo.text();
      const doc = new DOMParser().parseFromString(texto, "text/xml");
      const pegarTag = (el: Element | Document | null, tag: string) =>
        el?.getElementsByTagName(tag)[0]?.textContent ?? null;

      const infNFe = doc.getElementsByTagName("infNFe")[0];
      if (!infNFe) throw new Error("Este arquivo não parece ser um XML de NF-e.");
      const emit = doc.getElementsByTagName("emit")[0] ?? null;

      const itens: ItemNota[] = Array.from(doc.getElementsByTagName("det")).map((det) => {
        const prod = det.getElementsByTagName("prod")[0] ?? null;
        const ean = pegarTag(prod, "cEAN");
        return {
          descricaoNf: pegarTag(prod, "xProd") ?? "Item sem descrição",
          codigoFornecedor: pegarTag(prod, "cProd"),
          codigoBarras: ean && /^\d{8,14}$/.test(ean) ? ean : null,
          ncm: pegarTag(prod, "NCM"),
          quantidade: Number(pegarTag(prod, "qCom") ?? 0),
          valorUnit: Number(pegarTag(prod, "vUnCom") ?? 0),
          importar: true,
        };
      });

      setNota({
        numero: pegarTag(infNFe, "nNF"),
        serie: pegarTag(infNFe, "serie"),
        fornecedor: pegarTag(emit, "xNome"),
        valorTotal: Number(doc.getElementsByTagName("vNF")[0]?.textContent ?? 0),
        itens,
      });
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não consegui ler o XML.");
    }
  };

  const lerFotosNota = async (fotos: Blob[]) => {
    setAbrindoCamera(false);
    if (fotos.length === 0) return;
    setLendoFoto(true);
    setErro("");
    try {
      const formData = new FormData();
      fotos.forEach((f, i) => formData.append("imagem", f, `nota-${i}.jpg`));
      formData.append("modo", "nota");
      const resposta = await fetch("/api/ler-imagem", { method: "POST", body: formData });
      const resultado: RespostaNotaPorFoto = await resposta.json();
      if (!resposta.ok || resultado.erro) {
        setErro(resultado.erro ?? "Não deu para ler a nota na foto. Tente o XML ou preencha manualmente.");
        return;
      }
      const itens: ItemNota[] = (resultado.itens ?? []).map((item) => {
        const ean = item.codigoBarras ?? null;
        return {
          descricaoNf: item.descricao || "Item sem descrição",
          codigoFornecedor: null,
          codigoBarras: ean && /^\d{8,14}$/.test(ean) ? ean : null,
          ncm: null,
          quantidade: Number(item.quantidade ?? 0) || 1,
          valorUnit: Number(item.valorUnit ?? 0),
          importar: true,
        };
      });
      if (itens.length === 0) {
        setErro("Não consegui identificar itens nessa foto. Tente tirar de novo com mais luz, ou use o XML.");
        return;
      }
      setNota({
        numero: resultado.numero ?? null,
        serie: resultado.serie ?? null,
        fornecedor: resultado.fornecedor ?? null,
        valorTotal: Number(resultado.valorTotal ?? itens.reduce((s, i) => s + i.quantidade * i.valorUnit, 0)),
        itens,
      });
      setFotosNota([]);
    } catch {
      setErro("Não deu para falar com a IA agora. Tente o XML ou preencha manualmente.");
    } finally {
      setLendoFoto(false);
    }
  };

  const alternarItem = (indice: number) => {
    setNota((atual) =>
      atual
        ? { ...atual, itens: atual.itens.map((it, i) => (i === indice ? { ...it, importar: !it.importar } : it)) }
        : atual
    );
  };

  const importar = async () => {
    if (!nota) return;
    setImportando(true);
    setErro("");
    try {
      if (DEMO || !supabase) {
        await new Promise((r) => setTimeout(r, 500));
        router.push("/estoque");
        return;
      }
      for (const item of nota.itens.filter((i) => i.importar)) {
        let produtoId: string | null = null;
        if (item.codigoBarras) {
          const { data: existente } = await supabase
            .from("produtos")
            .select("id")
            .eq("codigo_barras", item.codigoBarras)
            .maybeSingle();
          produtoId = existente?.id ?? null;
        }
        if (!produtoId) {
          const { data: novo, error: eNovo } = await supabase
            .from("produtos")
            .insert({
              nome: item.descricaoNf,
              codigo_barras: item.codigoBarras,
              preco_custo: item.valorUnit,
              preco_venda: Number((item.valorUnit * 1.8).toFixed(2)),
            })
            .select("id")
            .single();
          if (eNovo) throw eNovo;
          produtoId = novo.id;
        }
        const { error: eMov } = await supabase.from("estoque_movimentos").insert({
          produto_id: produtoId,
          tipo: "entrada_nf",
          quantidade: item.quantidade,
          custo_unit: item.valorUnit,
        });
        if (eMov) throw eMov;
      }
      router.push("/estoque");
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não foi possível importar a nota.");
    } finally {
      setImportando(false);
    }
  };

  if (abrindoCamera) {
    return (
      <CameraCaptura
        onFoto={(blob) => setFotosNota((atual) => [...atual, blob])}
        onCancelar={() => {
          setAbrindoCamera(false);
          setFotosNota([]);
        }}
        onConcluir={() => lerFotosNota(fotosNota)}
        titulo="Enquadre a nota fiscal"
        multiplo
        contagemAtual={fotosNota.length}
      />
    );
  }

  return (
    <div className="flex flex-col gap-6 pt-4">
      <div>
        <h1 className="font-display text-2xl uppercase tracking-wide text-zinc-50">Entrada por Nota</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Solte o XML da NF-e do fornecedor, ou tire uma foto da nota e deixe a IA ler. Preço de venda entra com 80% de
          margem — ajuste depois.
        </p>
      </div>

      {!nota ? (
        <PainelVidro className="flex flex-col items-center gap-4 p-8 text-center">
          <label className="cursor-pointer">
            <span className="sr-only">Escolher arquivo XML</span>
            <input
              type="file"
              accept=".xml,text/xml"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && lerArquivo(e.target.files[0])}
            />
            <span className="inline-block rounded-lg border border-white/10 bg-white/5 px-5 py-3 text-sm font-bold uppercase tracking-wide text-zinc-200 hover:text-white">
              Escolher arquivo XML
            </span>
          </label>

          <span className="text-xs uppercase tracking-wide text-zinc-600">ou</span>

          <button
            onClick={() => setAbrindoCamera(true)}
            disabled={lendoFoto}
            className="inline-block rounded-lg border border-dashed border-white/20 px-5 py-3 text-sm font-bold uppercase tracking-wide text-zinc-400 hover:text-zinc-200"
          >
            {lendoFoto ? "Lendo a nota…" : "Fotografar a nota fiscal"}
          </button>

          {erro && <p className="mt-2 text-sm text-red-400">{erro}</p>}
        </PainelVidro>
      ) : (
        <>
          <PainelVidro className="p-5">
            <p className="text-sm font-medium text-zinc-100">{nota.fornecedor ?? "Fornecedor não identificado"}</p>
            <p className="font-mono text-xs text-zinc-500">
              NF {nota.numero} · série {nota.serie}
            </p>
            <p className="mt-2 font-mono text-xl font-bold text-zinc-50">
              {nota.valorTotal.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
            </p>
          </PainelVidro>

          <PainelVidro className="divide-y divide-white/5">
            {nota.itens.map((item, i) => (
              <button
                key={i}
                onClick={() => alternarItem(i)}
                className={`flex w-full items-start gap-3 p-4 text-left ${item.importar ? "" : "opacity-40"}`}
              >
                <span
                  className={`mt-0.5 h-5 w-5 shrink-0 rounded border-2 ${
                    item.importar ? "border-zinc-200 bg-zinc-200" : "border-white/20"
                  }`}
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm text-zinc-200">{item.descricaoNf}</span>
                  <span className="font-mono text-xs text-zinc-500">
                    {item.quantidade}× {item.valorUnit.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                  </span>
                </span>
              </button>
            ))}
          </PainelVidro>

          {erro && <p className="text-sm text-red-400">{erro}</p>}

          <TrailPlateButton onClick={importar} disabled={importando} className="w-full">
            {importando ? "Importando…" : `Importar ${nota.itens.filter((i) => i.importar).length} itens`}
          </TrailPlateButton>
        </>
      )}
    </div>
  );
}
