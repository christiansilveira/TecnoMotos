import type { Metadata } from "next";
import Script from "next/script";
import { Archivo, JetBrains_Mono, Manrope } from "next/font/google";
import "./globals.css";
import AppHeader from "@/components/AppHeader";
import FaixaDemo from "@/components/FaixaDemo";
import PageTransition from "@/components/PageTransition";
import AuthGate from "@/components/AuthGate";
import NavInferior from "@/components/NavInferior";
import TemaSync from "@/components/TemaSync";

// Roda antes do React hidratar, direto no <head>, pra cravar o atributo
// data-theme no <html> sem esperar o JS da store subir — sem isso, toda
// visita em modo claro mostraria um flash do tema escuro padrão por uma
// fração de segundo antes de trocar.
const SCRIPT_TEMA = `
(function () {
  try {
    var salvo = window.localStorage.getItem("tecnomotos-tema");
    if (salvo === "claro" || salvo === "escuro") {
      document.documentElement.dataset.theme = salvo;
    }
  } catch (e) {}
})();
`;

// Trocado de Inter — a fonte "padrão" de qualquer template/site gerado
// por IA — pra Manrope: geométrica, moderna, mas com identidade própria
// em vez de ser a escolha óbvia/genérica. Pedido do Christian ("mude as
// fontes... menos IA").
const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

// Design "Obsidiana": Archivo com eixo de largura — os títulos usam a
// versão expandida (font-stretch 125%, ver globals.css), no espírito de
// painel de moto esportiva premium.
const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  axes: ["wdth"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TECNOMOTOS",
  description: "Sistema de gestão para oficina de motos.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      className={`${manrope.variable} ${archivo.variable} ${jetbrainsMono.variable} h-full antialiased`}
      // O script inline (SCRIPT_TEMA, roda antes do React hidratar) já
      // grava `data-theme` no <html> a partir do localStorage — o HTML
      // que o servidor mandou nunca tem esse atributo (não tem como
      // saber o tema salvo no navegador do cliente). Sem isso aqui, todo
      // carregamento de página nova (não navegação client-side) disparava
      // um aviso de "hydration mismatch" nesse atributo no console —
      // inofensivo (o React mantém o valor certo do DOM), mas ruído que
      // não deveria estar lá. `suppressHydrationWarning` é o jeito
      // recomendado pelo React pra exatamente esse padrão de "atributo
      // escrito por um script antes da hidratação".
      suppressHydrationWarning
    >
      <body className="relative min-h-full font-sans text-zinc-100">
        <Script id="tema-inicial" strategy="beforeInteractive">
          {SCRIPT_TEMA}
        </Script>
        <TemaSync />
        <FaixaDemo />

        <AppHeader />

        <main className="relative mx-auto max-w-5xl px-4 pb-32 sm:pb-16">
          <AuthGate>
            <PageTransition>{children}</PageTransition>
          </AuthGate>
        </main>
        <NavInferior />
      </body>
    </html>
  );
}

