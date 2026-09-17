import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Rajdhani } from "next/font/google";
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

const inter = Inter({
  variable: "--font-inter",
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
      className={`${inter.variable} ${rajdhani.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="relative min-h-full font-sans text-zinc-100">
        <FaixaDemo />
        <WheelBackground3D />
        <GarageGridBackground />
        <HudDecoracao />
        <CreditoRoda3D />
        <NavVoltar />

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

