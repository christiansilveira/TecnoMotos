import type { DadosOSParaPdf, ItemOS } from "./tipos";
import { brl } from "./tipos";

/** Busca a logo do app e devolve como data URL — jsPDF precisa disso
 * (ou de um HTMLImageElement) pra `addImage`, não aceita uma URL comum. */
async function logoEmBase64(): Promise<string | null> {
  try {
    const resposta = await fetch("/logo-tecnomotos.jpg");
    const blob = await resposta.blob();
    return await new Promise((resolve, reject) => {
      const leitor = new FileReader();
      leitor.onload = () => resolve(leitor.result as string);
      leitor.onerror = () => reject(leitor.error);
      leitor.readAsDataURL(blob);
    });
  } catch {
    // Sem logo não é motivo pra travar o PDF inteiro — segue sem ela.
    return null;
  }
}

/**
 * Gera o PDF do orçamento de uma OS — com a marca da TECNOMOTOS, os
 * itens lançados e uma área de assinatura, pronto pra imprimir e o
 * cliente assinar na hora, ou pra mandar digitalmente (ver
 * components/AprovacaoOS.tsx). Desenhado à mão (sem plugin de tabela)
 * porque a lista de itens de uma OS é curta — não precisa de nada além
 * de `text`/`rect`/`line`.
 */
export async function gerarPdfOrcamento(os: DadosOSParaPdf, itens: ItemOS[], total: number): Promise<Blob> {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const largura = doc.internal.pageSize.getWidth();
  const margem = 18;
  let y = 20;

  const logo = await logoEmBase64();
  const deslocLogo = logo ? 22 : 0;
  if (logo) {
    try {
      doc.addImage(logo, "JPEG", margem, y - 7, 18, 18, undefined, "FAST");
    } catch {
      // formato inesperado — segue sem a imagem, não é crítico.
    }
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(20, 20, 20);
  doc.text("TECNOMOTOS", margem + deslocLogo, y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(150, 110, 0);
  doc.text("ORÇAMENTO DE SERVIÇO", margem + deslocLogo, y + 5);

  y += 9;
  doc.setFillColor(255, 199, 0);
  doc.rect(0, y, largura, 1.1, "F");
  y += 11;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(20, 20, 20);
  doc.text(`OS ${String(os.numero).padStart(4, "0")}`, margem, y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(110, 110, 110);
  doc.text(`Emitido em ${new Date().toLocaleDateString("pt-BR")}`, largura - margem, y, { align: "right" });

  y += 7;
  doc.setDrawColor(215, 215, 215);
  doc.line(margem, y, largura - margem, y);
  y += 7;

  const linhaCampo = (rotulo: string, valor: string) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(30, 30, 30);
    doc.text(rotulo, margem, y);
    doc.setFont("helvetica", "normal");
    doc.text(valor, margem + 26, y);
    y += 6;
  };

  linhaCampo("Cliente", os.clientes?.nome ?? "—");
  const veiculo = [os.veiculos?.marca, os.veiculos?.modelo, os.veiculos?.ano].filter(Boolean).join(" ");
  linhaCampo("Veículo", `${veiculo}${os.veiculos?.placa ? " · " + os.veiculos.placa : ""}`);
  if (os.km_entrada) linhaCampo("KM entrada", `${os.km_entrada.toLocaleString("pt-BR")} km`);

  const blocoTexto = (rotulo: string, texto: string) => {
    y += 2;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(30, 30, 30);
    doc.text(rotulo, margem, y);
    y += 5;
    doc.setFont("helvetica", "normal");
    doc.setTextColor(60, 60, 60);
    const linhas = doc.splitTextToSize(texto, largura - margem * 2);
    doc.text(linhas, margem, y);
    y += linhas.length * 5;
  };

  if (os.relato_cliente) blocoTexto("Reclamação relatada", os.relato_cliente);
  if (os.diagnostico) blocoTexto("Diagnóstico", os.diagnostico);

  y += 5;

  // Cabeçalho da tabela de itens
  doc.setFillColor(15, 17, 21);
  doc.rect(margem, y, largura - margem * 2, 8, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8.5);
  doc.setFont("helvetica", "bold");
  doc.text("DESCRIÇÃO", margem + 2, y + 5.3);
  doc.text("QTD", largura - margem - 52, y + 5.3, { align: "right" });
  doc.text("VALOR UNIT.", largura - margem - 26, y + 5.3, { align: "right" });
  doc.text("SUBTOTAL", largura - margem - 2, y + 5.3, { align: "right" });
  y += 8;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  const alturaLinha = 7;
  itens.forEach((item, i) => {
    if (y > 265) {
      doc.addPage();
      y = 20;
    }
    if (i % 2 === 1) {
      doc.setFillColor(244, 244, 246);
      doc.rect(margem, y, largura - margem * 2, alturaLinha, "F");
    }
    doc.setTextColor(30, 30, 30);
    doc.text(item.descricao, margem + 2, y + 5, { maxWidth: largura - margem * 2 - 86 });
    doc.text(String(item.quantidade), largura - margem - 52, y + 5, { align: "right" });
    doc.text(brl(item.valor_unit), largura - margem - 26, y + 5, { align: "right" });
    doc.text(brl(item.quantidade * item.valor_unit), largura - margem - 2, y + 5, { align: "right" });
    y += alturaLinha;
  });
  if (itens.length === 0) {
    doc.setTextColor(140, 140, 140);
    doc.text("Nenhum item lançado ainda.", margem + 2, y + 5);
    y += alturaLinha;
  }

  y += 4;
  doc.setDrawColor(215, 215, 215);
  doc.line(margem, y, largura - margem, y);
  y += 9;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(20, 20, 20);
  doc.text("TOTAL", margem, y);
  doc.text(brl(total), largura - margem, y, { align: "right" });

  y += 16;
  if (y > 250) {
    doc.addPage();
    y = 20;
  }

  if (os.aprovado_por) {
    // OS já aprovada pelo cliente na página pública (app/aprovar/[id])
    // — sai com a assinatura já preenchida em vez da linha em branco
    // pra assinar na mão, pedido do Christian: "depois de aprovado, e
    // assinado com o nome e cpf, pode colocar na OS para quando baixar
    // já vir com a assinatura".
    const alturaCaixa = os.aprovado_cpf ? 22 : 17;
    doc.setFillColor(230, 250, 238);
    doc.rect(margem, y, largura - margem * 2, alturaCaixa, "F");
    doc.setDrawColor(0, 150, 90);
    doc.setLineWidth(0.6);
    doc.rect(margem, y, largura - margem * 2, alturaCaixa, "S");
    doc.setLineWidth(0.2);

    // Nada de caractere Unicode (✓) aqui — a fonte padrão do jsPDF
    // (helvetica) não tem esse glifo e ele saía como um sinal errado no
    // PDF gerado; o check é desenhado à mão com duas linhas, alinhado
    // com a linha de base do texto ao lado (y + 6).
    doc.setDrawColor(0, 140, 80);
    doc.setLineWidth(0.8);
    doc.line(margem + 3.2, y + 4.3, margem + 4.6, y + 6.1);
    doc.line(margem + 4.6, y + 6.1, margem + 7.5, y + 2.2);
    doc.setLineWidth(0.2);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.setTextColor(0, 120, 70);
    doc.text("APROVADO E ASSINADO DIGITALMENTE", margem + 11, y + 6);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(40, 60, 50);
    doc.text(`Assinado por: ${os.aprovado_por}`, margem + 4, y + 12);
    let linhaAssinatura = y + 12;
    if (os.aprovado_cpf) {
      linhaAssinatura += 5;
      doc.text(`CPF: ${os.aprovado_cpf}`, margem + 4, linhaAssinatura);
    }
    if (os.aprovado_em) {
      const dataAprovacao = new Date(os.aprovado_em).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
      doc.text(`Em: ${dataAprovacao}`, largura - margem - 4, linhaAssinatura, { align: "right" });
    }
  } else {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(90, 90, 90);
    doc.text(
      "Declaro estar de acordo com os serviços e valores descritos acima e autorizo a execução.",
      margem,
      y,
      { maxWidth: largura - margem * 2 },
    );
    y += 22;
    doc.setDrawColor(30, 30, 30);
    doc.line(margem, y, margem + 80, y);
    doc.line(largura - margem - 55, y, largura - margem, y);
    doc.setFontSize(8.5);
    doc.setTextColor(110, 110, 110);
    doc.text("Assinatura do cliente", margem, y + 5);
    doc.text("Data", largura - margem - 55, y + 5);
  }

  doc.setFontSize(8);
  doc.setTextColor(160, 160, 160);
  doc.text("TECNOMOTOS — oficina mecânica", margem, 287);

  return doc.output("blob");
}
