import type { Metadata } from "next";
import Image from "next/image";
import { Archivo_Black, Inter } from "next/font/google";
import "./globals.css";
import TireTrackBackground from "@/components/TireTrackBackground";
import SkullHeader3D from "@/components/SkullHeader3D";
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

export const metadata: Metadata = {
  title: "TECNOMOTOS",
  description: "Sistema de gestão para oficina de motos.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      className={`${inter.variable} ${archivoBlack.variable} h-full antialiased`}
    >
      <body className="relative min-h-full font-sans text-zinc-100">
        <FaixaDemo />
        <TireTrackBackground />
        <NavVoltar />

        <header className="relative flex flex-col items-center gap-3 pb-6 pt-10">
          <Image
            src="/logo-tecnomotos.jpg"
            alt="TECNOMOTOS"
            width={72}
            height={72}
            className="rounded-2xl border border-white/10"
            priority
          />
          <SkullHeader3D />
          <h1 className="font-display text-3xl uppercase tracking-widest text-zinc-50">
            TECNOMOTOS
          </h1>
        </header>

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

