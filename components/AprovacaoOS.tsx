"use client";

import { useState } from "react";
import TrailPlateButton from "@/components/TrailPlateButton";
import { DEMO, supabase } from "@/lib/supabase";
import { gerarPdfOrcamento } from "@/lib/gerarPdfOrcamento";
import { brl, type ItemOS, type OrdemServico, type StatusOS } from "@/lib/tipos";

interface AprovacaoOSProps {
  os: OrdemServico;
  itens: ItemOS[];
  total: number;
  /** Chamado depois da OS avançar sozinha pra "aguardando_aprovacao" —
   * quem usa decide como refletir isso na tela (recarregar, etc.). */
  onStatusAtualizado?: (novoStatus: StatusOS) => void;
}

const STATUS_QUE_AVANCAM: StatusOS[] = ["recepcao", "diagnostico"];

/**
 * Botões pra levar o orçamento até o cliente aprovar/assinar — faltava
 * isso na tela (Christian: "não apareceu o botão para enviar a OS para
 * aprovação e assinatura do cliente").
 *
 * "Baixar PDF" gera o orçamento com a marca da oficina e uma área de
 * assinatura, pronto pra imprimir na hora. "Enviar para aprovação"
 * tenta o compartilhamento nativo do navegador já com o PDF anexado
 * (funciona em Android/Chrome, por exemplo — abre a folha de
 * compartilhar do sistema com o WhatsApp como uma das opções); onde
 * isso não é suportado (a maioria dos desktops), baixa o PDF e abre o
 * WhatsApp com a mensagem pronta, faltando só anexar o arquivo à mão.
 *
 * Em qualquer um dos dois casos de envio, se a OS ainda estiver em
 * "recepção"/"diagnóstico" ela avança sozinha pra "aguardando_aprovacao"
 * — status que já existia no pipeline (Trilha da Moto/Kanban) mas que
 * nada colocava a OS nele até agora.
 */
export default function AprovacaoOS({ os, itens, total, onStatusAtualizado }: AprovacaoOSProps) {
  const [gerando, setGerando] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");

  const avancarParaAguardandoAprovacao = async () => {
    if (!STATUS_QUE_AVANCAM.includes(os.status)) return;
    if (DEMO || !supabase) {
      onStatusAtualizado?.("aguardando_aprovacao");
      return;
    }
    const { error } = await supabase.from("ordens_servico").update({ status: "aguardando_aprovacao" }).eq("id", os.id);
    if (!error) onStatusAtualizado?.("aguardando_aprovacao");
  };

  const nomeArquivo = `OS-${String(os.numero).padStart(4, "0")}-orcamento.pdf`;

  const baixarPdf = async () => {
    setGerando(true);
    setErro("");
    try {
      const blob = await gerarPdfOrcamento(os, itens, total);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = nomeArquivo;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setErro("Não deu para gerar o PDF agora.");
    } finally {
      setGerando(false);
    }
  };

  const enviarParaCliente = async () => {
    setEnviando(true);
    setErro("");
    try {
      const blob = await gerarPdfOrcamento(os, itens, total);
      const texto = `Olá${os.clientes?.nome ? ", " + os.clientes.nome : ""}! Segue o orçamento da OS ${String(
        os.numero,
      ).padStart(4, "0")} da TECNOMOTOS para aprovação. Total: ${brl(total)}.`;

      const arquivo = new File([blob], nomeArquivo, { type: "application/pdf" });
      const suportaArquivo =
        typeof navigator !== "undefined" &&
        typeof navigator.canShare === "function" &&
        navigator.canShare({ files: [arquivo] });

      if (suportaArquivo) {
        await navigator.share({ files: [arquivo], title: `Orçamento OS ${os.numero}`, text: texto });
      } else {
        // Sem suporte a anexar arquivo no compartilhamento (a maioria
        // dos navegadores de desktop): baixa o PDF e abre o WhatsApp
        // com o texto pronto — só falta anexar o arquivo na conversa.
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = nomeArquivo;
        a.click();
        URL.revokeObjectURL(url);
        const telefone = os.clientes?.telefone?.replace(/\D/g, "");
        const linkZap = `https://wa.me/${telefone ? "55" + telefone : ""}?text=${encodeURIComponent(
          `${texto} (baixei o PDF — é só anexar aqui na conversa)`,
        )}`;
        window.open(linkZap, "_blank", "noopener,noreferrer");
      }
      await avancarParaAguardandoAprovacao();
    } catch (e) {
      if ((e as Error)?.name !== "AbortError") setErro("Não deu para enviar agora.");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="mt-4 flex flex-col gap-2 border-t border-white/10 pt-4 sm:flex-row sm:items-center">
      <TrailPlateButton tamanho="sm" onClick={enviarParaCliente} disabled={enviando} className="flex-1">
        {enviando ? "Preparando…" : "Enviar para aprovação"}
      </TrailPlateButton>
      <button
        type="button"
        onClick={baixarPdf}
        disabled={gerando}
        className="rounded-md border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-zinc-300 transition-colors hover:text-zinc-100"
      >
        {gerando ? "Gerando…" : "Baixar PDF"}
      </button>
      {erro && <p className="text-xs text-red-400 sm:basis-full">{erro}</p>}
    </div>
  );
}
