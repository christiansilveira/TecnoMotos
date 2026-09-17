import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * Cria conta de acesso pra equipe da oficina. Não existe cadastro público
 * de verdade: só cria a conta se vier junto o "código da oficina" — uma
 * senha combinada entre o dono e a equipe (CODIGO_CADASTRO_OFICINA),
 * conferida aqui no servidor. Sem o código certo, ninguém de fora
 * consegue criar login, mesmo achando a tela.
 *
 * Usa a chave secreta do Supabase (SUPABASE_SECRET_KEY) — só existe no
 * servidor — porque criar usuário direto (sem precisar confirmar e-mail)
 * exige a API de admin, que a chave pública do navegador não acessa.
 */
export async function POST(req: NextRequest) {
  const codigoEsperado = process.env.CODIGO_CADASTRO_OFICINA;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const chaveSecreta = process.env.SUPABASE_SECRET_KEY;

  if (!codigoEsperado || !url || !chaveSecreta) {
    return NextResponse.json(
      { erro: "Criação de conta ainda não configurada no servidor. Veja o README." },
      { status: 500 }
    );
  }

  let corpo: { nome?: string; email?: string; senha?: string; codigo?: string };
  try {
    corpo = await req.json();
  } catch {
    return NextResponse.json({ erro: "Pedido inválido." }, { status: 400 });
  }

  const { nome, email, senha, codigo } = corpo;
  if (!nome?.trim() || !email?.trim() || !senha) {
    return NextResponse.json({ erro: "Preencha nome, e-mail e senha." }, { status: 400 });
  }
  if (senha.length < 6) {
    return NextResponse.json({ erro: "A senha precisa ter pelo menos 6 caracteres." }, { status: 400 });
  }
  if (codigo !== codigoEsperado) {
    return NextResponse.json({ erro: "Código da oficina incorreto." }, { status: 403 });
  }

  const admin = createClient(url, chaveSecreta, { auth: { autoRefreshToken: false, persistSession: false } });
  const { error } = await admin.auth.admin.createUser({
    email: email.trim(),
    password: senha,
    email_confirm: true, // ferramenta interna — ninguém confere caixa de entrada aqui
    user_metadata: { nome: nome.trim() },
  });

  if (error) {
    const mensagem =
      error.message.includes("already been registered") || error.message.includes("already registered")
        ? "Já existe conta com esse e-mail. Tente entrar em vez de criar."
        : error.message;
    return NextResponse.json({ erro: mensagem }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
