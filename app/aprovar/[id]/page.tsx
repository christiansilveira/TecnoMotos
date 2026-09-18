"use client";

import { use, useEffect, useState } from "react";
import PainelVidro from "@/components/ui/PainelVidro";
import BadgeStatus from "@/components/ui/BadgeStatus";
import TrailPlateButton from "@/components/TrailPlateButton";
import Campo from "@/components/ui/Campo";
import { RevealGroup, RevealItem } from "@/components/ui/Reveal";
import { gerarPdfOrcamento } from "@/lib/gerarPdfOrcamento";
import { cpfValido, formatarCpf } from "@/lib/cpf";
import { brl, type DadosOSParaPdf, type ItemOS, type StatusOS } from "@/lib/tipos";

type OSPublica = DadosOSParaPdf & { status: StatusOS };

const STATUS_JA_DECIDIDO: StatusOS[] = ["aprovado", "em_execucao", "aguardando_peca", "finalizado", "entregue"];

/**
 * Página pública de aprovação de orçamento — pedido do Christian: "um
 * link para ele assinar como se tivesse dentro do sistema e tbm o
 * PDF". Não passa pelo AuthGate (ver a checagem de rota lá) porque o
 * cliente da oficina não tem (e não deve precisar de) login — os
 * dados vêm só da API pública (app/api/orcamento-publico), que já
 * filtra o que pode ser exposto sem sessão.
 */
export default function PaginaAprovacaoPublica({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [os, setOs] = useState<OSPublica | null>(null);
  const [itens, setItens] = useState<ItemOS[]>([]);
  const [nome, setNome] = useState("");
  const [cpf, setCpf] = useState("");
  const [aprovando, setAprovando] = useState(false);
  const [erroAprovar, setErroAprovar] = useState("");
  const [aprovado, setAprovado] = useState(false);
  const [gerandoPdf, setGerandoPdf] = useState(false);

  useEffect(() => {
    fetch(`/api/orcamento-publico/${id}`)
      .then(async (r) => {
        const corpo = await r.json();
        if (!r.ok) {
          setErro(corpo.erro ?? "Não foi possível carregar o orçamento.");
          return;
        }
        setOs(corpo.os);
        setItens(corpo.itens ?? []);
      })
      .catch(() => setErro("Não foi possível carregar o orçamento."))
      .finally(() => setCarregando(false));
  }, [id]);

  const total = itens.reduce((soma, i) => soma + i.quantidade * i.valor_unit, 0);

  const baixarPdf = async () => {
    if (!os) return;
    setGerandoPdf(true);
    try {
      const blob = await gerarPdfOrcamento(os, itens, total);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `OS-${String(os.numero).padStart(4, "0")}-orcamento.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setGerandoPdf(false);
    }
  };

  const aprovar = async () => {
    setAprovando(true);
    setErroAprovar("");
    try {
      const resposta = await fetch(`/api/orcamento-publico/${id}/aprovar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome: nome.trim(), cpf }),
      });
      const corpo = await resposta.json();
      if (!resposta.ok) {
        setErroAprovar(corpo.erro ?? "Não foi possível aprovar agora.");
        return;
      }
      setAprovado(true);
      // Atualiza os dados locais com a assinatura — assim, se o cliente
      // clicar em "Baixar PDF" logo em seguida (sem recarregar a
      // página), o PDF já sai com a aprovação preenchida.
      setOs((atual) =>
        atual
          ? { ...atual, status: "aprovado", aprovado_por: nome.trim(), aprovado_cpf: formatarCpf(cpf), aprovado_em: new Date().toISOString() }
          : atual,
      );
    } catch {
      setErroAprovar("Não foi possível falar com o servidor agora.");
    } finally {
      setAprovando(false);
    }
  };

  if (carregando) {
    return (
      <div className="pt-4">
        <div className="h-8 w-48 animate-pulse rounded bg-white/5" />
        <div className="mt-4 h-64 animate-pulse rounded-xl bg-white/5" />
      </div>
    );
  }

  if (erro || !os) {
    return (
      <PainelVidro className="mt-4 p-8 text-center">
        <p className="text-sm text-zinc-400">{erro || "Orçamento não encontrado."}</p>
      </PainelVidro>
    );
  }

  const jaDecidido = STATUS_JA_DECIDIDO.includes(os.status);
  const cancelado = os.status === "cancelado";

  return (
    <RevealGroup className="flex flex-col gap-6 pt-4">
      <RevealItem className="flex items-center justify-between">
        <h1 className="font-mono text-2xl font-bold text-zinc-50">Orçamento OS {String(os.numero).padStart(4, "0")}</h1>
        <BadgeStatus status={os.status} tamanho="md" />
      </RevealItem>

      <RevealItem>
        <PainelVidro className="p-5">
          <p className="text-sm font-medium text-zinc-100">{os.clientes?.nome ?? "Cliente"}</p>
          <p className="text-xs text-zinc-500">
            {[os.veiculos?.marca, os.veiculos?.modelo, os.veiculos?.ano].filter(Boolean).join(" ")}
            {os.veiculos?.placa ? ` · ${os.veiculos.placa}` : ""}
          </p>
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
          {os.diagnostico_fotos && os.diagnostico_fotos.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2 border-t border-white/5 pt-3">
              {os.diagnostico_fotos.map((url, i) => (
                <a
                  key={url}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block h-16 w-16 overflow-hidden rounded-lg border border-white/10"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt={`Foto ${i + 1} do problema`} className="h-full w-full object-cover" />
                </a>
              ))}
            </div>
          )}
        </PainelVidro>
      </RevealItem>

      <RevealItem>
        <PainelVidro className="p-5">
          <h2 className="font-display text-sm uppercase tracking-wide text-zinc-200">Itens e serviços</h2>
          <div className="mt-3 divide-y divide-white/5">
            {itens.length === 0 && <p className="py-3 text-sm text-zinc-500">Nenhum item lançado ainda.</p>}
            {itens.map((i) => (
              <div key={i.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                <div className="min-w-0 flex-1">
                  <span className="block truncate text-zinc-300">{i.descricao}</span>
                  <span className="text-[10px] uppercase tracking-wide text-zinc-600">
                    {i.tipo === "peca" ? "Peça" : "Serviço"} · {i.quantidade}x {brl(i.valor_unit)}
                  </span>
                </div>
                <span className="shrink-0 font-mono text-zinc-400">{brl(i.quantidade * i.valor_unit)}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-white/10 pt-3">
            <span className="font-display text-sm uppercase text-zinc-200">Total</span>
            <span className="font-mono text-lg font-bold text-zinc-50">{brl(total)}</span>
          </div>

          <button
            type="button"
            onClick={baixarPdf}
            disabled={gerandoPdf}
            className="mt-4 w-full rounded-md border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-zinc-300 transition-colors hover:text-zinc-100"
          >
            {gerandoPdf ? "Gerando…" : "Baixar PDF do orçamento"}
          </button>
        </PainelVidro>
      </RevealItem>

      <RevealItem>
        <PainelVidro className="p-5" corStatus={cancelado ? "248 113 113" : "74 222 128"}>
          {cancelado ? (
            <p className="text-sm text-zinc-300">Esta ordem de serviço foi cancelada — fale com a oficina se isso for um engano.</p>
          ) : aprovado || jaDecidido ? (
            <>
              <p className="text-sm font-bold uppercase tracking-wide text-emerald-400">Orçamento aprovado</p>
              <p className="mt-2 text-sm text-zinc-300">Obrigado! A oficina já foi avisada e vai seguir com o serviço.</p>
            </>
          ) : (
            <>
              <h2 className="font-display text-sm uppercase tracking-wide text-zinc-200">Aprovar orçamento</h2>
              <p className="mt-2 text-sm text-zinc-400">
                Digite seu nome completo e CPF e confirme abaixo — isso vale como sua assinatura, aprovando os serviços e
                valores acima.
              </p>
              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Campo label="Nome completo" value={nome} onChange={setNome} placeholder="Seu nome" />
                <Campo
                  label="CPF"
                  value={cpf}
                  onChange={(v) => setCpf(formatarCpf(v))}
                  placeholder="000.000.000-00"
                  inputMode="numeric"
                />
              </div>
              {cpf.length >= 14 && !cpfValido(cpf) && (
                <p className="mt-2 text-xs text-red-400">CPF inválido — confira os números digitados.</p>
              )}
              {erroAprovar && (
                <p className="mt-3 rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">
                  {erroAprovar}
                </p>
              )}
              <div className="mt-4">
                <TrailPlateButton onClick={aprovar} disabled={aprovando || !nome.trim() || !cpfValido(cpf)} className="w-full">
                  {aprovando ? "Aprovando…" : "Aprovo e assino os serviços e valores acima"}
                </TrailPlateButton>
              </div>
            </>
          )}
        </PainelVidro>
      </RevealItem>
    </RevealGroup>
  );
}
