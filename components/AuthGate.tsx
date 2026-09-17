"use client";

import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import PainelVidro from "./ui/PainelVidro";
import Campo from "./ui/Campo";
import TrailPlateButton from "./TrailPlateButton";
import { DEMO, supabase } from "@/lib/supabase";

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
    <div className="mx-auto flex w-full max-w-sm flex-col gap-6 pt-6">
      <div className="text-center">
        <p className="text-xs uppercase tracking-[.2em] text-zinc-500">Área restrita da equipe</p>
        <h1 className="mt-1 font-display text-xl uppercase text-zinc-50">
          {modo === "entrar" ? "Entrar" : "Criar conta"}
        </h1>
      </div>

      <PainelVidro className="flex flex-col gap-4 p-5">
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
        {erro && <p className="text-sm text-red-400">{erro}</p>}
      </PainelVidro>

      <TrailPlateButton
        onClick={modo === "entrar" ? entrar : criarConta}
        disabled={enviando || !email || !senha || (modo === "criar" && (!nome || !codigo))}
        className="w-full"
      >
        {enviando ? "Um instante…" : modo === "entrar" ? "Entrar" : "Criar conta"}
      </TrailPlateButton>

      <button
        onClick={() => {
          setModo(modo === "entrar" ? "criar" : "entrar");
          setErro("");
        }}
        className="text-center text-xs uppercase tracking-wide text-zinc-500 hover:text-zinc-300"
      >
        {modo === "entrar" ? "Ainda não tenho conta" : "Já tenho conta"}
      </button>
    </div>
  );
}
