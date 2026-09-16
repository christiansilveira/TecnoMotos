"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import PainelVidro from "@/components/ui/PainelVidro";
import TrailPlateButton from "@/components/TrailPlateButton";
import { DEMO, supabase } from "@/lib/supabase";

/**
 * Versão simplificada da recepção: cadastro por formulário. A leitura
 * de placa por câmera/OCR e a fila de fotos offline do app original
 * ainda não foram portadas para cá — dependem de testar em aparelho de
 * verdade, e é por isso que ficaram de fora desta rodada.
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

  const salvar = async () => {
    setSalvando(true);
    setErro("");
    try {
      if (DEMO || !supabase) {
        // Modo demonstração: não há banco de verdade pra gravar.
        await new Promise((r) => setTimeout(r, 400));
        router.push("/ordens");
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

  return (
    <div className="flex flex-col gap-6 pt-4">
      <div>
        <h1 className="font-display text-2xl uppercase tracking-wide text-zinc-50">Entrada de Veículo</h1>
        <p className="mt-1 text-sm text-zinc-400">Cadastro por formulário — leitura de placa por câmera ainda não portada.</p>
      </div>

      <PainelVidro className="flex flex-col gap-4 p-5">
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
