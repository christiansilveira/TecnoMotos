"use client";

import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import Campo from "./ui/Campo";
import TrailPlateButton from "./TrailPlateButton";
import { DEMO, supabase } from "@/lib/supabase";
import { useBikerStore } from "@/store/useBikerStore";

/**
 * Portão de login de verdade pra equipe da oficina — diferente da trava
 * de PIN do Dashboard (essa continua igual, é uma camada extra só pros
 * números financeiros). Sem sessão, mostra entrar/criar conta em vez do
 * app; criar conta exige o código combinado com a equipe (ver
 * app/api/criar-conta). Em modo demonstração não trava nada — mantém o
 * app navegável sem Supabase configurado, igual ao resto do sistema.
 */
export default function AuthGate({ children }: { children: React.ReactNode }) {
  const [pronto, setPronto] = useState(false);
  const [sessao, setSessao] = useState<Session | null>(null);
  const [modo, setModo] = useState<"entrar" | "criar">("entrar");
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [codigo, setCodigo] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");

  useEffect(() => {
    if (DEMO || !supabase) {
      setPronto(true);
      return;
    }
    const cliente = supabase;
    cliente.auth.getSession().then(({ data }) => {
      setSessao(data.session);
      setPronto(true);
    });
    const { data: assinatura } = cliente.auth.onAuthStateChange((_evento, novaSessao) => {
      setSessao(novaSessao);
    });
    return () => assinatura.subscription.unsubscribe();
  }, []);

  const entrar = async () => {
    if (!supabase) return;
    setEnviando(true);
    setErro("");
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password: senha });
    setEnviando(false);
    if (error) {
      setErro(error.message === "Invalid login credentials" ? "E-mail ou senha incorretos." : error.message);
    }
  };

  const criarConta = async () => {
    if (!supabase) return;
    setEnviando(true);
    setErro("");
    try {
      const resposta = await fetch("/api/criar-conta", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome, email: email.trim(), senha, codigo }),
      });
      const resultado = await resposta.json();
      if (!resposta.ok || resultado.erro) {
        setErro(resultado.erro ?? "Não foi possível criar a conta.");
        return;
      }
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password: senha });
      if (error) setErro(error.message);
    } catch {
      setErro("Não deu para falar com o servidor agora.");
    } finally {
      setEnviando(false);
    }
  };

  const sair = async () => {
    await supabase?.auth.signOut();
  };

  const setTelaLogin = useBikerStore((s) => s.setTelaLogin);
  const mostrarLogin = pronto && !DEMO && !!supabase && !sessao;

  // Avisa o AppHeader pra dar mais presença à logo enquanto essa tela
  // estiver na frente — some de novo assim que sair dela (login feito,
  // ou o próprio AuthGate desmontar).
  useEffect(() => {
    setTelaLogin(mostrarLogin);
    return () => setTelaLogin(false);
  }, [mostrarLogin, setTelaLogin]);

  if (!pronto) return null;
  if (DEMO || !supabase) return <>{children}</>;

  if (sessao) {
    return (
      <>
        <button
          onClick={sair}
          aria-label="Sair da conta"
          className="vidro-garagem fixed right-4 top-4 z-40 flex h-11 items-center justify-center rounded-full px-4 text-[10px] font-bold uppercase tracking-wide text-zinc-300 transition-transform hover:-translate-y-0.5 active:scale-95"
        >
          Sair
        </button>
        {children}
      </>
    );
  }

  return (
    <div className="relative mx-auto flex w-full max-w-sm flex-col gap-4 pt-1">
      {/* Holofote atrás do cartão — o mesmo truque de luz da caveira 3D no
          header, pra essa tela não parecer um formulário largado sobre o
          degradê vazio. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-0 -z-10 h-64 w-64 -translate-x-1/2 rounded-full"
        style={{
          background: "radial-gradient(circle, rgba(255,199,0,.14) 0%, rgba(255,199,0,.04) 45%, transparent 72%)",
          filter: "blur(8px)",
        }}
      />

      <div className="flex items-center justify-center gap-2">
        <span className="flex h-6 w-6 items-center justify-center rounded-full border border-amber-400/25 bg-amber-400/10 text-amber-300">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M7 10.5V8a5 5 0 0 1 10 0v2.5M6 10.5h12a1 1 0 0 1 1 1V20a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-8.5a1 1 0 0 1 1-1Z"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle cx="12" cy="15" r="1.4" fill="currentColor" />
          </svg>
        </span>
        <p className="text-xs uppercase tracking-[.2em] text-zinc-500">Área restrita da equipe</p>
      </div>

      <div className="vidro-login flex flex-col gap-4 rounded-xl p-5">
        <div className="grid grid-cols-2 gap-1 rounded-lg border border-white/10 bg-black/30 p-1">
          {(["entrar", "criar"] as const).map((opcao) => (
            <button
              key={opcao}
              type="button"
              onClick={() => {
                setModo(opcao);
                setErro("");
              }}
              className={`rounded-md py-2 text-xs font-bold uppercase tracking-wide transition-colors ${
                modo === opcao ? "bg-amber-400/15 text-amber-300" : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {opcao === "entrar" ? "Entrar" : "Criar conta"}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-4">
          {modo === "criar" && <Campo label="Nome" value={nome} onChange={setNome} placeholder="Seu nome" />}
          <Campo label="E-mail" value={email} onChange={setEmail} placeholder="voce@oficina.com" type="email" />
          <Campo label="Senha" value={senha} onChange={setSenha} placeholder="••••••••" type="password" />
          {modo === "criar" && (
            <Campo
              label="Código da oficina"
              value={codigo}
              onChange={setCodigo}
              placeholder="Combinado com a equipe"
            />
          )}
        </div>

        {erro && (
          <div className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
            {erro}
          </div>
        )}
      </div>

      <TrailPlateButton
        onClick={modo === "entrar" ? entrar : criarConta}
        disabled={enviando || !email || !senha || (modo === "criar" && (!nome || !codigo))}
        className="w-full"
      >
        {enviando ? "Um instante…" : modo === "entrar" ? "Entrar" : "Criar conta"}
      </TrailPlateButton>
    </div>
  );
}
