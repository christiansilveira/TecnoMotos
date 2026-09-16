"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import PainelVidro from "@/components/ui/PainelVidro";
import { DEMO, supabase } from "@/lib/supabase";
import { PRODUTOS_DEMO } from "@/lib/dados-demo";
import { brl, type Produto } from "@/lib/tipos";

export default function EstoquePage() {
  const [produtos, setProdutos] = useState<Produto[] | null>(null);
  const [busca, setBusca] = useState("");

  const carregar = useCallback(async () => {
    if (DEMO || !supabase) {
      setProdutos(PRODUTOS_DEMO);
      return;
    }
    const { data } = await supabase.from("vw_estoque").select("*").eq("ativo", true).order("nome").limit(300);
    setProdutos((data as Produto[]) ?? []);
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const visiveis = useMemo(() => {
    if (!produtos) return [];
    const termo = busca.trim().toLowerCase();
    if (!termo) return produtos;
    return produtos.filter(
      (p) => p.nome.toLowerCase().includes(termo) || (p.sku ?? "").toLowerCase().includes(termo)
    );
  }, [produtos, busca]);

  const criticos = (produtos ?? []).filter((p) => p.situacao !== "ok").length;

  return (
    <div className="flex flex-col gap-6 pt-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl uppercase tracking-wide text-zinc-50">Estoque</h1>
          <p className="mt-1 text-sm text-zinc-400">{produtos?.length ?? "…"} peças cadastradas</p>
        </div>
        <div className="flex shrink-0 gap-2">
          <Link
            href="/estoque/cadastro-rapido"
            className="vidro-garagem rounded-lg px-3 py-2 text-xs font-bold uppercase tracking-wide text-zinc-200 hover:text-white"
          >
            Cadastro Rápido
          </Link>
          <Link
            href="/estoque/importar-nota"
            className="vidro-garagem rounded-lg px-3 py-2 text-xs font-bold uppercase tracking-wide text-zinc-200 hover:text-white"
          >
            Entrada por NF
          </Link>
        </div>
      </div>

      <input
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
        placeholder="Buscar peça por nome ou SKU"
        className="vidro-garagem rounded-lg px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-500 outline-none focus:border-zinc-400"
      />

      {criticos > 0 && (
        <PainelVidro className="flex items-center gap-3 p-4" style={{ borderColor: "rgba(251,146,60,.4)" }}>
          <span className="h-2 w-2 shrink-0 rounded-full bg-orange-400" />
          <p className="text-sm text-zinc-200">
            <b>{criticos}</b> {criticos === 1 ? "peça precisa" : "peças precisam"} de reposição
          </p>
        </PainelVidro>
      )}

      {!produtos ? (
        <div className="grid gap-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-white/5" style={{ animationDelay: `${i * 90}ms` }} />
          ))}
        </div>
      ) : (
        <PainelVidro className="divide-y divide-white/5">
          {visiveis.map((p) => (
            <div key={p.id} className="flex items-center justify-between gap-3 p-4">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-zinc-100">{p.nome}</p>
                <p className="font-mono text-xs text-zinc-500">
                  {p.sku ?? "s/ código"} · {brl(p.preco_venda)}
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p
                  className="font-mono text-lg font-bold"
                  style={{ color: p.situacao === "ok" ? "rgb(228 228 231)" : "rgb(248 113 113)" }}
                >
                  {p.saldo}
                </p>
                <p className="text-[10px] uppercase tracking-wide text-zinc-500">{p.unidade}</p>
              </div>
            </div>
          ))}
          {visiveis.length === 0 && <p className="p-6 text-center text-sm text-zinc-500">Nenhuma peça encontrada.</p>}
        </PainelVidro>
      )}
    </div>
  );
}
