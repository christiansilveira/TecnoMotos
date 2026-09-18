"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import PainelVidro from "@/components/ui/PainelVidro";
import BadgeStatus from "@/components/ui/BadgeStatus";
import Campo from "@/components/ui/Campo";
import TrailPlateButton from "@/components/TrailPlateButton";
import CameraCaptura from "@/components/CameraCaptura";
import { DEMO, supabase } from "@/lib/supabase";
import { buscarHistoricoDemoPorPlaca } from "@/lib/dados-demo";
import { brl, normalizarPlaca, type StatusOS } from "@/lib/tipos";

interface HistoricoPlaca {
  veiculoId: string;
  clienteId: string;
  cliente: { nome: string; telefone: string | null };
  veiculo: {
    marca: string | null;
    modelo: string | null;
    ano: number | null;
    km_atual: number | null;
    fotos_url: string[] | null;
  };
  ordens: { id: string; numero: number; status: StatusOS; aberta_em: string; valor_total: number }[];
}

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

  // Histórico do cliente/moto quando a placa digitada já existe no
  // cadastro — pedido do Christian: "ao puxar a mesma placa, tem que
  // puxar um histórico daquele cliente, moto". `historico` guarda o
  // cliente/veículo/OS anteriores encontrados; quando presente, salvar
  // reaproveita esses ids em vez de duplicar cliente/veículo.
  const [consultandoPlaca, setConsultandoPlaca] = useState(false);
  const [historico, setHistorico] = useState<HistoricoPlaca | null>(null);
  const [placaConsultada, setPlacaConsultada] = useState("");

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
        const lida = String(resultado.placa).toUpperCase();
        setPlaca(lida);
        if (resultado.marca) setMarca(String(resultado.marca));
        if (resultado.modelo) setModelo(String(resultado.modelo));
        consultarPlaca(lida);
      } else {
        setAvisoLeitura("Placa ilegível na foto. Digite manualmente abaixo.");
      }
    } catch {
      setAvisoLeitura("Não deu para ler a placa agora. Digite manualmente.");
    } finally {
      setLendoPlaca(false);
    }
  };

  /** Procura placa/cliente/histórico já cadastrados — chamado ao sair
   * do campo Placa e depois de uma leitura por foto bem-sucedida.
   * Encontrando, pré-preenche os campos (só os que ainda estiverem
   * vazios, pra não sobrescrever o que a pessoa já digitou) e guarda
   * os ids em `historico` pra `salvar` reaproveitar em vez de duplicar
   * cliente/veículo no banco. */
  const consultarPlaca = async (valorPlaca: string) => {
    const normalizada = normalizarPlaca(valorPlaca);
    if (normalizada.length < 7 || normalizada === placaConsultada) return;
    setPlacaConsultada(normalizada);
    setConsultandoPlaca(true);
    setHistorico(null);
    try {
      if (DEMO || !supabase) {
        const achado = buscarHistoricoDemoPorPlaca(normalizada);
        if (achado) {
          // Dados demo não têm km_atual do veículo (só km_entrada por OS) —
          // fica null aqui, sem inventar valor.
          const veiculoHist = {
            marca: achado.veiculo.marca,
            modelo: achado.veiculo.modelo,
            ano: achado.veiculo.ano,
            km_atual: null,
            fotos_url: achado.veiculo.fotos_url ?? null,
          };
          setHistorico({
            veiculoId: achado.veiculo.id,
            clienteId: achado.cliente.id ?? "",
            cliente: achado.cliente,
            veiculo: veiculoHist,
            ordens: achado.historico,
          });
          if (!nomeCliente) setNomeCliente(achado.cliente.nome);
          if (!telefone && achado.cliente.telefone) setTelefone(achado.cliente.telefone);
          if (!marca && veiculoHist.marca) setMarca(veiculoHist.marca);
          if (!modelo && veiculoHist.modelo) setModelo(veiculoHist.modelo);
        }
        return;
      }

      // Antes desta correção, o cadastro gravava a placa como
      // `placa.toUpperCase()` (sem normalizar), então uma moto cadastrada
      // digitando "BRA2E19" (sem traço) ficava salva assim — e essa
      // consulta, buscando só o formato normalizado ("BRA-2E19"), nunca
      // encontrava (Christian: "fiz uma OS com a mesma placa e não puxou
      // o cadastro/histórico"). `salvar()` abaixo já foi corrigido pra
      // sempre gravar normalizado dali em diante, mas motos cadastradas
      // antes dessa correção continuam com o formato antigo — por isso a
      // busca aqui tenta as duas grafias (com e sem traço) em vez de só a
      // normalizada.
      const semTraco = normalizada.replace("-", "");
      const variantes = semTraco === normalizada ? [normalizada] : [normalizada, semTraco];
      const { data: veiculos } = await supabase
        .from("veiculos")
        .select("id, marca, modelo, ano, km_atual, fotos_url, cliente_id, clientes(id, nome, telefone)")
        .in("placa", variantes)
        .limit(1);
      const veiculo = veiculos?.[0];
      if (!veiculo) return;

      const cliente = Array.isArray(veiculo.clientes) ? veiculo.clientes[0] : veiculo.clientes;
      const { data: ordens } = await supabase
        .from("ordens_servico")
        .select("id, numero, status, aberta_em, valor_total")
        .eq("veiculo_id", veiculo.id)
        .order("aberta_em", { ascending: false })
        .limit(10);

      setHistorico({
        veiculoId: veiculo.id,
        clienteId: veiculo.cliente_id,
        cliente: cliente ?? { nome: "", telefone: null },
        veiculo: {
          marca: veiculo.marca,
          modelo: veiculo.modelo,
          ano: veiculo.ano,
          km_atual: veiculo.km_atual,
          fotos_url: veiculo.fotos_url ?? null,
        },
        ordens: (ordens as HistoricoPlaca["ordens"]) ?? [],
      });
      if (!nomeCliente && cliente?.nome) setNomeCliente(cliente.nome);
      if (!telefone && cliente?.telefone) setTelefone(cliente.telefone);
      if (!marca && veiculo.marca) setMarca(veiculo.marca);
      if (!modelo && veiculo.modelo) setModelo(veiculo.modelo);
    } catch {
      // Consulta é só uma conveniência — se falhar, a pessoa continua
      // preenchendo o formulário normalmente, sem bloquear nada.
    } finally {
      setConsultandoPlaca(false);
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
      // Placa já cadastrada (achada em `consultarPlaca`, ainda batendo com
      // o que está digitado agora): reaproveita cliente/veículo em vez de
      // criar duplicata — era esse o ponto do pedido do Christian ("ao
      // puxar a mesma placa, tem que puxar um histórico daquele cliente,
      // moto"). Sem isso, cada visita de um cliente que já veio antes
      // geraria uma linha nova em `clientes` e `veiculos`.
      const reaproveitando = historico && normalizarPlaca(placa) === placaConsultada;

      let clienteId: string;
      let veiculoId: string;
      let fotosExistentes: string[] = [];

      if (reaproveitando && historico) {
        clienteId = historico.clienteId;
        veiculoId = historico.veiculoId;
        fotosExistentes = historico.veiculo.fotos_url ?? [];

        // Atualiza os dados que a pessoa pode ter corrigido na tela
        // (nome, telefone, marca/modelo, km) — melhor esforço: se falhar,
        // a OS ainda assim é aberta com os dados já cadastrados.
        await supabase
          .from("clientes")
          .update({ nome: nomeCliente, telefone: telefone.replace(/\D/g, "") })
          .eq("id", clienteId);
        await supabase
          .from("veiculos")
          .update({ marca, modelo, km_atual: km ? +km : historico.veiculo.km_atual })
          .eq("id", veiculoId);
      } else {
        const { data: cliente, error: eCliente } = await supabase
          .from("clientes")
          .insert({ nome: nomeCliente, telefone: telefone.replace(/\D/g, "") })
          .select("id")
          .single();
        if (eCliente) throw eCliente;
        clienteId = cliente.id;

        const { data: veiculo, error: eVeiculo } = await supabase
          .from("veiculos")
          .insert({ placa: normalizarPlaca(placa), cliente_id: clienteId, marca, modelo, km_atual: km ? +km : null })
          .select("id")
          .single();
        if (eVeiculo) throw eVeiculo;
        veiculoId = veiculo.id;
      }

      // Fotos da moto: melhor esforço — se o bucket de storage ainda não
      // foi criado no Supabase, a OS continua sendo aberta normalmente,
      // só sem as fotos anexadas ao veículo. Quando o veículo já tinha
      // fotos de uma visita anterior, as novas são somadas às antigas em
      // vez de substituí-las.
      if (fotosVeiculo.length > 0) {
        const urls: string[] = [];
        for (let i = 0; i < fotosVeiculo.length; i++) {
          const caminho = `${veiculoId}/${Date.now()}-${i}.jpg`;
          const { error: eUpload } = await supabase.storage
            .from("veiculos-fotos")
            .upload(caminho, fotosVeiculo[i].blob, { contentType: "image/jpeg" });
          if (!eUpload) {
            const { data: pub } = supabase.storage.from("veiculos-fotos").getPublicUrl(caminho);
            if (pub?.publicUrl) urls.push(pub.publicUrl);
          }
        }
        if (urls.length > 0) {
          await supabase.from("veiculos").update({ fotos_url: [...fotosExistentes, ...urls] }).eq("id", veiculoId);
        }
      }

      const { data: os, error: eOs } = await supabase
        .from("ordens_servico")
        .insert({
          veiculo_id: veiculoId,
          cliente_id: clienteId,
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

        <Campo
          label="Placa"
          value={placa}
          onChange={(v) => {
            setPlaca(v);
            // Placa mudou pra algo diferente do que já foi consultado —
            // limpa o histórico antigo pra não mostrar cliente errado
            // enquanto a pessoa termina de digitar a placa nova.
            if (normalizarPlaca(v) !== placaConsultada) {
              setHistorico(null);
              setPlacaConsultada("");
            }
          }}
          onBlur={() => consultarPlaca(placa)}
          placeholder="ABC-1D23"
        />

        {consultandoPlaca && <p className="text-xs text-zinc-500">Procurando essa placa no cadastro…</p>}

        {historico && (
          <PainelVidro className="p-4" corStatus="255 199 0">
            <p className="text-[11px] uppercase tracking-wide text-amber-300">Placa já cadastrada</p>
            <p className="mt-1 text-sm font-medium text-zinc-100">
              {historico.cliente.nome || "Cliente sem nome"}
              {historico.veiculo.marca || historico.veiculo.modelo ? (
                <span className="text-zinc-400">
                  {" · "}
                  {[historico.veiculo.marca, historico.veiculo.modelo, historico.veiculo.ano].filter(Boolean).join(" ")}
                </span>
              ) : null}
            </p>
            {historico.veiculo.km_atual != null && (
              <p className="text-xs text-zinc-500">Última km registrada: {historico.veiculo.km_atual.toLocaleString("pt-BR")} km</p>
            )}

            {historico.ordens.length > 0 ? (
              <div className="mt-3 divide-y divide-white/5 border-t border-white/10">
                {historico.ordens.map((os) => (
                  <Link
                    key={os.id}
                    href={`/ordens/${os.id}`}
                    className="flex items-center justify-between gap-3 py-2 text-sm hover:bg-white/5"
                  >
                    <span className="text-zinc-400">
                      OS {String(os.numero).padStart(4, "0")} · {new Date(os.aberta_em).toLocaleDateString("pt-BR")}
                    </span>
                    <span className="flex items-center gap-2">
                      <span className="font-mono text-zinc-300">{brl(os.valor_total)}</span>
                      <BadgeStatus status={os.status} />
                    </span>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="mt-2 text-xs text-zinc-500">Nenhuma OS anterior encontrada pra essa moto.</p>
            )}
          </PainelVidro>
        )}

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
