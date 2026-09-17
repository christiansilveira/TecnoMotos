import { NextRequest, NextResponse } from "next/server";

/**
 * gemini-3.1-flash-lite: geração estável desde mai/2026, com camada
 * gratuita e leitura de imagem. gemini-2.5-flash (usado na versão
 * antiga em HTML) está com desligamento agendado para 16/out/2026—
 * por isso a troca, para não nascer já com prazo de validade.
 */
const MODELO = "gemini-3.1-flash-lite";

const PROMPTS: Record<string, string> = {
  placa:
    "Esta é a foto de um veículo brasileiro. Extraia APENAS a placa. " +
    "Formatos válidos: 3 letras + 4 números (ABC1234) ou Mercosul 3 letras + número + letra + 2 números (ABC1D23). " +
    'Responda somente com JSON, sem markdown: {"placa":"ABC1D23","confianca":0.0-1.0,"marca":null,"modelo":null,"cor":null}. ' +
    'Se não conseguir ler a placa, use "placa":null.',
  peca:
    "Esta é a foto de uma peça automotiva ou da etiqueta dela. Extraia o que conseguir. " +
    'Responda somente com JSON, sem markdown: {"nome":"","codigo_barras":null,"sku":null,"fabricante":null,"aplicacao":null}.',
  nota:
    "Esta é a foto de uma nota fiscal (NF-e/NFC-e) de compra de peças, pode estar amassada, torta ou com parte cortada — leia o que conseguir. " +
    "Extraia o cabeçalho e a lista de itens comprados. " +
    'Responda somente com JSON, sem markdown, neste formato: {"numero":null,"serie":null,"fornecedor":null,"valorTotal":0,' +
    '"itens":[{"descricao":"","codigoBarras":null,"quantidade":1,"valorUnit":0}]}. ' +
    "Quantidade e valorUnit são números (use ponto decimal, nunca vírgula). " +
    "Se não conseguir ler algum campo, use null (ou lista vazia em itens) em vez de inventar.",
};

const LIMITE_TOKENS: Record<string, number> = { nota: 2000 };

/**
 * Proxy server-side para a Gemini API. A chave (GEMINI_API_KEY) só
 * existe aqui no servidor — nunca no navegador. Se o cliente chamasse
 * a Gemini direto, a chave apareceria na aba de rede do navegador de
 * qualquer pessoa que abrisse o app.
 */
export async function POST(req: NextRequest) {
  const chave = process.env.GEMINI_API_KEY;
  if (!chave) {
    return NextResponse.json(
      { erro: "GEMINI_API_KEY não configurada no servidor. Veja o README para gerar uma chave grátis." },
      { status: 500 }
    );
  }

  const formData = await req.formData();
  // Aceita uma ou várias fotos no mesmo campo "imagem" — cadastro rápido
  // de peça manda várias (ângulos diferentes) pra Gemini juntar o máximo
  // de informação num só pedido; placa continua mandando só uma.
  const imagens = formData.getAll("imagem").filter((v): v is File => v instanceof File);
  const modo = String(formData.get("modo") ?? "placa");

  if (imagens.length === 0) {
    return NextResponse.json({ erro: "Nenhuma imagem enviada." }, { status: 400 });
  }
  if (imagens.length > 6) {
    return NextResponse.json({ erro: "Muitas fotos de uma vez — envie no máximo 6." }, { status: 400 });
  }

  const prompt = PROMPTS[modo] ?? PROMPTS.placa;
  const partesImagem = await Promise.all(
    imagens.map(async (imagem) => {
      const bytes = Buffer.from(await imagem.arrayBuffer());
      return { inline_data: { mime_type: imagem.type || "image/jpeg", data: bytes.toString("base64") } };
    })
  );
  const promptFinal =
    imagens.length > 1
      ? `${prompt} Você recebeu ${imagens.length} fotos do mesmo item em ângulos diferentes — combine o que der pra ler em todas para preencher o JSON com o máximo de informação possível.`
      : prompt;

  let resposta: Response;
  try {
    resposta = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODELO}:generateContent?key=${chave}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: promptFinal }, ...partesImagem],
            },
          ],
          generationConfig: { temperature: 0, maxOutputTokens: LIMITE_TOKENS[modo] ?? 300 },
        }),
      }
    );
  } catch {
    return NextResponse.json({ erro: "Não deu para falar com a Gemini agora. Digite manualmente." }, { status: 502 });
  }

  if (!resposta.ok) {
    const detalhe = await resposta.text().catch(() => "");
    return NextResponse.json(
      { erro: `A Gemini recusou a chamada (${resposta.status}). Confira a chave. ${detalhe.slice(0, 200)}` },
      { status: 502 }
    );
  }

  interface RespostaGemini {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  }
  const dados = (await resposta.json()) as RespostaGemini;
  const texto = dados.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  const limpo = texto.replace(/```json|```/g, "").trim();

  try {
    const json = JSON.parse(limpo);
    return NextResponse.json(json);
  } catch {
    return NextResponse.json({ erro: "Não deu para interpretar a resposta da Gemini. Digite manualmente." }, { status: 502 });
  }
}
