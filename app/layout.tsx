import type { Metadata } from "next";
import { Archivo_Black, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import TireTrackBackground from "@/components/TireTrackBackground";
import AppHeader from "@/components/AppHeader";
import { CreditoModelo3D } from "@/components/CreditoModelo3D";
import NavVoltar from "@/components/NavVoltar";
import FaixaDemo from "@/components/FaixaDemo";
import PageTransition from "@/components/PageTransition";
import AuthGate from "@/components/AuthGate";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const archivoBlack = Archivo_Black({
  variable: "--font-archivo-black",
  weight: "400",
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
      className={`${inter.variable} ${archivoBlack.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="relative min-h-full font-sans text-zinc-100">
        <FaixaDemo />
        <TireTrackBackground />
        <NavVoltar />

        <AppHeader />

        <main className="relative mx-auto max-w-5xl px-4 pb-16">
          <AuthGate>
            <PageTransition>{children}</PageTransition>
          </AuthGate>
        </main>

        <footer className="relative pb-6">
          <CreditoModelo3D />
        </footer>
      </body>
    </html>
  );
}

