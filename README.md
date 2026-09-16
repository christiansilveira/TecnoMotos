This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## TECNOMOTOS

### Configurar o Supabase de verdade
Crie um arquivo `.env.local` na raiz com:
```
NEXT_PUBLIC_SUPABASE_URL=https://SEU-PROJETO.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-anon-key
```
Sem isso, o app roda em **modo demonstração** (`lib/supabase.ts` detecta a ausência das variáveis) com os dados de `lib/dados-demo.ts` — funciona igual, só não grava nada de verdade.

Tabelas esperadas no Supabase: `ordens_servico`, `veiculos`, `clientes`, `os_itens`, `vw_estoque` (view de produtos com saldo calculado) — os mesmos nomes e campos do app original.

### O que já está pronto
Home, Entrada de veículo (por formulário), Ordens de Serviço (quadro com tempo real do Supabase), detalhe da OS com troca de situação, Estoque, Dashboard — todas de vidro fosco sobre o degradê, com a caveira 3D e a placa de trilha nos botões.

### O que ainda falta portar
- Leitura de placa por câmera/OCR (a de formulário está no lugar por enquanto)
- Fila offline de fotos (IndexedDB)
- Geração de OS em PDF e envio de orçamento por WhatsApp
- Importação de peças por XML de NF-e
- Página pública de aprovação de orçamento (o cliente aprova pelo link)

Essas partes dependem de testar em aparelho de verdade (câmera, sinal de rede variável) — não dá pra validar isso só com build e servidor local.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
