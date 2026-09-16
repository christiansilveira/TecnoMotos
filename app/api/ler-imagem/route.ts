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
};

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
  const imagem = formData.get("imagem");
  const modo = String(formData.get("modo") ?? "placa");

  if (!(imagem instanceof Blob)) {
    return NextResponse.json({ erro: "Nenhuma imagem enviada." }, { status: 400 });
  }

  const prompt = PROMPTS[modo] ?? PROMPTS.placa;
  const bytes = Buffer.from(await imagem.arrayBuffer());
  const base64 = bytes.toString("base64");

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
              parts: [{ text: prompt }, { inline_data: { mime_type: imagem.type || "image/jpeg", data: base64 } }],
            },
          ],
          generationConfig: { temperature: 0, maxOutputTokens: 300 },
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
