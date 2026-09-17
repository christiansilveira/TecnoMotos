This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## TECNOMOTOS

### Configurar a leitura de placa/etiqueta por câmera (Gemini)
1. Entre em [aistudio.google.com/apikey](https://aistudio.google.com/apikey) com uma conta Google e gere uma chave — a camada gratuita cobre esse uso tranquilamente.
2. Adicione ao `.env.local` (e nas variáveis de ambiente da Vercel):
   ```
   GEMINI_API_KEY=sua-chave-aqui
   ```
   **Sem o prefixo `NEXT_PUBLIC_`** — essa chave só deve existir no servidor (`app/api/ler-imagem/route.ts`). Se ela tivesse o prefixo `NEXT_PUBLIC_`, apareceria no navegador de qualquer pessoa que abrisse o app.
3. Modelo usado: `gemini-3.1-flash-lite` — estável desde maio/2026, com camada gratuita. (O `gemini-2.5-flash` da versão antiga em HTML está com desligamento agendado para 16/out/2026, por isso a troca.)
4. Testado de verdade contra a API do Google nesta rodada — sem chave configurada, o app avisa e deixa preencher manualmente; com uma chave inválida, mostra o erro exato que o Google devolve.

### Configurar o Supabase de verdade
Crie um arquivo `.env.local` na raiz com:
```
NEXT_PUBLIC_SUPABASE_URL=https://SEU-PROJETO.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-anon-key
```
Sem isso, o app roda em **modo demonstração** (`lib/supabase.ts` detecta a ausência das variáveis) com os dados de `lib/dados-demo.ts` — funciona igual, só não grava nada de verdade.

Tabelas esperadas no Supabase: `ordens_servico`, `veiculos`, `clientes`, `os_itens`, `vw_estoque` (view de produtos com saldo calculado) — os mesmos nomes e campos do app original.

### Configurar o login da equipe
O app agora exige login (Supabase Auth) — só quem tem conta acessa. Não existe cadastro público de verdade: a tela de "criar conta" só cria a conta se a pessoa souber o código combinado com a equipe.

1. Em **Project Settings → API Keys** no Supabase, copie a **chave secreta** (`sb_secret_...`, antigo "service_role") — nunca a publishable/anon.
2. Adicione ao `.env.local` (e nas variáveis de ambiente da Vercel, como **Secret**, nunca com `NEXT_PUBLIC_`):
   ```
   SUPABASE_SECRET_KEY=sua-chave-secreta-aqui
   CODIGO_CADASTRO_OFICINA=escolha-um-código-e-combine-com-a-equipe
   ```
3. Rode (de novo, se já rodou antes) o `supabase/schema.sql` — ele também aperta a política de acesso das tabelas pra exigir login.
4. Abra o app, use "Ainda não tenho conta", digite o código e crie a primeira conta (a sua). Depois disso, é só passar o mesmo código pra quem mais precisar ter acesso.

O PIN do Dashboard (`components/ui/TrancaDashboard.tsx`) continua existindo do jeito que estava — é uma trava extra só sobre os números financeiros, separada do login geral, pensada pra ficar só com o dono.

### O que já está pronto
Home, Entrada de veículo com foto de placa lida pela Gemini, Cadastro rápido de peça com foto de etiqueta lida pela Gemini, Ordens de Serviço (quadro com tempo real do Supabase), detalhe da OS com troca de situação (com botão de salvar), Estoque com importação de NF-e por XML, Dashboard com trava por PIN — todas de vidro fosco sobre o degradê, com a caveira 3D, a placa de trilha nos botões, e um botão de voltar fixo em toda tela.

### O que ainda falta portar
- Fila offline de fotos (IndexedDB) — se o sinal cair no meio do cadastro, a foto se perde nesta versão
- Geração de OS em PDF e envio de orçamento por WhatsApp
- Página pública de aprovação de orçamento (o cliente aprova pelo link)
- Tela de login (veja o aviso sobre RLS aberta no `schema.sql`)

Essas partes dependem de testar em aparelho de verdade (câmera, sinal de rede variável) ou de decisões de produto (ex.: como o cliente recebe o link de orçamento) — não dá pra validar isso só com build e servidor local.

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
