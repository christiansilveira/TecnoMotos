import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { DEMO } from "@/lib/supabase";
import { ITENS_DEMO, ORDENS_DEMO } from "@/lib/dados-demo";

/**
 * Dados de uma OS pra a página pública de aprovação
 * (app/aprovar/[id]/page.tsx) — o cliente abre esse link pelo WhatsApp
 * sem estar logado, então essa rota roda com a chave secreta do
 * Supabase (mesmo padrão de app/api/criar-conta) em vez de depender de
 * RLS de sessão, e devolve só os campos que fazem sentido pro cliente
 * ver: nada de ids internos, custo de peça, ou dados de outros
 * clientes/veículos.
 */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  if (DEMO) {
    const os = ORDENS_DEMO.find((o) => o.id === id);
    if (!os) return NextResponse.json({ erro: "Ordem de serviço não encontrada." }, { status: 404 });
    const itens = ITENS_DEMO.filter((i) => i.os_id === id);
    return NextResponse.json({
      os: {
        numero: os.numero,
        status: os.status,
        km_entrada: os.km_entrada,
        relato_cliente: os.relato_cliente,
        diagnostico: os.diagnostico,
        veiculos: os.veiculos,
        clientes: os.clientes,
      },
      itens,
    });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const chaveSecreta = process.env.SUPABASE_SECRET_KEY;
  if (!url || !chaveSecreta) {
    return NextResponse.json({ erro: "Servidor sem a configuração do Supabase." }, { status: 500 });
  }
  const admin = createClient(url, chaveSecreta, { auth: { autoRefreshToken: false, persistSession: false } });

  const { data: os, error: erroOS } = await admin
    .from("ordens_servico")
    .select(
      "numero, status, km_entrada, relato_cliente, diagnostico, veiculos(placa, marca, modelo, ano), clientes(nome, telefone)",
    )
    .eq("id", id)
    .single();
  if (erroOS || !os) {
    return NextResponse.json({ erro: "Ordem de serviço não encontrada." }, { status: 404 });
  }

  const { data: itens } = await admin
    .from("os_itens")
    .select("id, os_id, tipo, descricao, quantidade, valor_unit")
    .eq("os_id", id)
    .order("criado_em");

  return NextResponse.json({ os, itens: itens ?? [] });
}
