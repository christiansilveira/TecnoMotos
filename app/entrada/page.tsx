"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import PainelVidro from "@/components/ui/PainelVidro";
import Campo from "@/components/ui/Campo";
import TrailPlateButton from "@/components/TrailPlateButton";
import CameraCaptura from "@/components/CameraCaptura";
import { DEMO, supabase } from "@/lib/supabase";

/**
 * Versão simplificada da recepção: cadastro por formulário, com a
 * opção de fotografar a placa (sem leitura automática — veja
 * CameraCaptura). A fila de fotos offline do app original ainda não
 * foi portada; depende de testar em aparelho de verdade.
 */
export default function EntradaPage() {
  const router = useRouter();
  const [placa, setPlaca] = useState("");
  const [nomeCliente, setNomeCliente] = useState("");
  const [telefone, setTelefone] = useState("");
  const [marca, setMarca] = useState("");
  const [modelo, setModelo] = useState("");
  const [km, setKm] = useState("");
  const [relato, setRelato] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const [avisoDemo, setAvisoDemo] = useState(false);
  const [abrindoCamera, setAbrindoCamera] = useState(false);
  const [fotoPlaca, setFotoPlaca] = useState<string | null>(null);
  const [lendoPlaca, setLendoPlaca] = useState(false);
  const [avisoLeitura, setAvisoLeitura] = useState("");

  // Fotos gerais da moto (carroceria, riscos, avarias) — separadas da
  // foto da placa: ficam salvas no arquivo do veículo pra consulta
  // depois, sem depender de nenhuma leitura automática.
  const [abrindoCameraVeiculo, setAbrindoCameraVeiculo] = useState(false);
  const [fotosVeiculo, setFotosVeiculo] = useState<{ blob: Blob; url: string }[]>([]);

  const adicionarFotoVeiculo = (blob: Blob) => {
    setFotosVeiculo((atual) => [...atual, { blob, url: URL.createObjectURL(blob) }]);
  };

  const removerFotoVeiculo = (indice: number) => {
    setFotosVeiculo((atual) => {
      const copia = [...atual];
      const [removida] = copia.splice(indice, 1);
      if (removida) URL.revokeObjectURL(removida.url);
      return copia;
    });
  };

  const capturarFoto = async (blob: Blob) => {
    setFotoPlaca(URL.createObjectURL(blob));
    setAbrindoCamera(false);
    setLendoPlaca(true);
    setAvisoLeitura("");
    try {
      const formData = new FormData();
      formData.append("imagem", blob, "placa.jpg");
      formData.append("modo", "placa");
      const resposta = await fetch("/api/ler-imagem", { method: "POST", body: formData });
      const resultado = await resposta.json();
      if (!resposta.ok || resultado.erro) {
        setAvisoLeitura(resultado.erro ?? "Não deu para ler a placa. Digite manualmente.");
        return;
      }
      if (resultado.placa) {
        setPlaca(String(resultado.placa).toUpperCase());
        if (resultado.marca) setMarca(String(resultado.marca));
        if (resultado.modelo) setModelo(String(resultado.modelo));
      } else {
        setAvisoLeitura("Placa ilegível na foto. Digite manualmente abaixo.");
      }
    } catch {
      setAvisoLeitura("Não deu para ler a placa agora. Digite manualmente.");
    } finally {
      setLendoPlaca(false);
    }
  };

  const salvar = async () => {
    setSalvando(true);
    setErro("");
    try {
      if (DEMO || !supabase) {
        // Modo demonstração: não há banco de verdade pra gravar — por
        // isso mostramos isso explicitamente em vez de só redirecionar
        // como se tivesse funcionado de verdade.
        await new Promise((r) => setTimeout(r, 400));
        setAvisoDemo(true);
        setSalvando(false);
        return;
      }
      const { data: cliente, error: eCliente } = await supabase
        .from("clientes")
        .insert({ nome: nomeCliente, telefone: telefone.replace(/\D/g, "") })
        .select("id")
        .single();
      if (eCliente) throw eCliente;

      const { data: veiculo, error: eVeiculo } = await supabase
        .from("veiculos")
        .insert({ placa: placa.toUpperCase(), cliente_id: cliente.id, marca, modelo, km_atual: km ? +km : null })
        .select("id")
        .single();
      if (eVeiculo) throw eVeiculo;

      // Fotos da moto: melhor esforço — se o bucket de storage ainda não
      // foi criado no Supabase, a OS continua sendo aberta normalmente,
      // só sem as fotos anexadas ao veículo.
      if (fotosVeiculo.length > 0) {
        const urls: string[] = [];
        for (let i = 0; i < fotosVeiculo.length; i++) {
          const caminho = `${veiculo.id}/${Date.now()}-${i}.jpg`;
          const { error: eUpload } = await supabase.storage
            .from("veiculos-fotos")
            .upload(caminho, fotosVeiculo[i].blob, { contentType: "image/jpeg" });
          if (!eUpload) {
            const { data: pub } = supabase.storage.from("veiculos-fotos").getPublicUrl(caminho);
            if (pub?.publicUrl) urls.push(pub.publicUrl);
          }
        }
        if (urls.length > 0) {
          await supabase.from("veiculos").update({ fotos_url: urls }).eq("id", veiculo.id);
        }
      }

      const { data: os, error: eOs } = await supabase
        .from("ordens_servico")
        .insert({
          veiculo_id: veiculo.id,
          cliente_id: cliente.id,
          km_entrada: km ? +km : null,
          relato_cliente: relato || null,
          status: "diagnostico",
        })
        .select("id")
        .single();
      if (eOs) throw eOs;

      router.push(`/ordens/${os.id}`);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não foi possível abrir a OS.");
    } finally {
      setSalvando(false);
    }
  };

  if (abrindoCamera) {
    return <CameraCaptura onFoto={capturarFoto} onCancelar={() => setAbrindoCamera(false)} />;
  }

  if (abrindoCameraVeiculo) {
    return (
      <CameraCaptura
        titulo="Fotografe a moto"
        multiplo
        contagemAtual={fotosVeiculo.length}
        onFoto={adicionarFotoVeiculo}
        onCancelar={() => setAbrindoCameraVeiculo(false)}
        onConcluir={() => setAbrindoCameraVeiculo(false)}
      />
    );
  }

  return (
    <div className="flex flex-col gap-6 pt-4">
      <div>
        <h1 className="font-display text-2xl uppercase tracking-wide text-zinc-50">Entrada de Veículo</h1>
        <p className="mt-1 text-sm text-zinc-400">Placa, dados do cliente e fotos da moto pro arquivo do veículo.</p>
      </div>

      {avisoDemo && (
        <PainelVidro className="border border-amber-400/40 p-4 text-sm text-amber-200">
          Em modo demonstração isto não grava de verdade — nenhum banco Supabase está configurado ainda. Configure as
          variáveis de ambiente para a OS ser criada de fato.
        </PainelVidro>
      )}

      <PainelVidro className="flex flex-col gap-4 p-5">
        <div>
          <span className="mb-2 block text-[11px] uppercase tracking-wide text-zinc-500">Foto da placa</span>
          {fotoPlaca ? (
            <div className="relative overflow-hidden rounded-lg border border-white/10">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={fotoPlaca} alt="Foto da placa" className="h-32 w-full object-cover" />
              {lendoPlaca && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/60 text-xs uppercase tracking-wide text-white">
                  Lendo a placa…
                </div>
              )}
              <button
                onClick={() => {
                  setFotoPlaca(null);
                  setAvisoLeitura("");
                }}
                className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/70 text-zinc-200"
                aria-label="Remover foto"
              >
                ✕
              </button>
            </div>
          ) : (
            <button
              onClick={() => setAbrindoCamera(true)}
              className="flex h-16 w-full items-center justify-center gap-2 rounded-lg border border-dashed border-white/20 text-sm text-zinc-400 hover:text-zinc-200"
            >
              Fotografar a placa
            </button>
          )}
          {avisoLeitura && <p className="mt-2 text-xs text-amber-300">{avisoLeitura}</p>}
        </div>

        <div>
          <span className="mb-2 block text-[11px] uppercase tracking-wide text-zinc-500">
            Fotos da moto {fotosVeiculo.length > 0 && `(${fotosVeiculo.length})`}
          </span>
          {fotosVeiculo.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-2">
              {fotosVeiculo.map((f, i) => (
                <div key={f.url} className="relative h-16 w-16 overflow-hidden rounded-lg border border-white/10">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={f.url} alt={`Foto ${i + 1} da moto`} className="h-full w-full object-cover" />
                  <button
                    onClick={() => removerFotoVeiculo(i)}
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
            onClick={() => setAbrindoCameraVeiculo(true)}
            className="flex h-14 w-full items-center justify-center gap-2 rounded-lg border border-dashed border-white/20 text-sm text-zinc-400 hover:text-zinc-200"
          >
            {fotosVeiculo.length > 0 ? "Tirar mais fotos da moto" : "Fotografar a moto — salva no arquivo do cliente"}
          </button>
        </div>

        <Campo label="Placa" value={placa} onChange={setPlaca} placeholder="ABC-1D23" />
        <div className="grid grid-cols-2 gap-3">
          <Campo label="Marca" value={marca} onChange={setMarca} placeholder="Honda" />
          <Campo label="Modelo" value={modelo} onChange={setModelo} placeholder="CG 160" />
        </div>
        <Campo label="Nome do cliente" value={nomeCliente} onChange={setNomeCliente} placeholder="Quem trouxe o veículo" />
        <Campo label="WhatsApp" value={telefone} onChange={setTelefone} placeholder="41 98888-7777" />
        <Campo label="Quilometragem" value={km} onChange={setKm} placeholder="18420" />
        <label className="block">
          <span className="mb-2 block text-[11px] uppercase tracking-wide text-zinc-500">Reclamação do cliente</span>
          <textarea
            value={relato}
            onChange={(e) => setRelato(e.target.value)}
            rows={3}
            placeholder="Barulho na frente ao frear…"
            className="w-full rounded-lg border border-white/10 bg-white/5 p-3 text-sm text-zinc-100 outline-none focus:border-zinc-400"
          />
        </label>
        {erro && <p className="text-sm text-red-400">{erro}</p>}
      </PainelVidro>

      <TrailPlateButton onClick={salvar} disabled={salvando || !placa || !nomeCliente} className="w-full">
        {salvando ? "Abrindo OS…" : "Abrir OS"}
      </TrailPlateButton>
    </div>
  );
}
