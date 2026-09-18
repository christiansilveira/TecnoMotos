import type { Metadata } from "next";
import Script from "next/script";
import { JetBrains_Mono, Manrope, Rajdhani } from "next/font/google";
import "./globals.css";
import GarageGridBackground from "@/components/GarageGridBackground";
import WheelBackground3D from "@/components/WheelBackground3D";
import { CreditoRoda3D } from "@/components/CreditoRoda3D";
import HudDecoracao from "@/components/HudDecoracao";
import AppHeader from "@/components/AppHeader";
import NavVoltar from "@/components/NavVoltar";
import FaixaDemo from "@/components/FaixaDemo";
import PageTransition from "@/components/PageTransition";
import AuthGate from "@/components/AuthGate";
import TemaToggle from "@/components/TemaToggle";
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

// Trocado de Archivo Black (bloco pesado, sem muita personalidade além
// da grossura) pra Rajdhani: mesma família de fontes técnicas/racing
// usada em painel de moto e HUD de corrida — pedido do Christian pra
// modernizar a tipografia de destaque.
const rajdhani = Rajdhani({
  variable: "--font-rajdhani",
  weight: "700",
  subsets: ["latin"],
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
      className={`${manrope.variable} ${rajdhani.variable} ${jetbrainsMono.variable} h-full antialiased`}
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
        <WheelBackground3D />
        <GarageGridBackground />
        <HudDecoracao />
        <CreditoRoda3D />
        <NavVoltar />
        <TemaToggle />

        <AppHeader />

        <main className="relative mx-auto max-w-5xl px-4 pb-16">
          <AuthGate>
            <PageTransition>{children}</PageTransition>
          </AuthGate>
        </main>
      </body>
    </html>
  );
}

