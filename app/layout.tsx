import type { Metadata } from "next";
import { Archivo_Black, Inter } from "next/font/google";
import "./globals.css";
import TireTrackBackground from "@/components/TireTrackBackground";
import SkullHeader3D from "@/components/SkullHeader3D";
import { CreditoModelo3D } from "@/components/CreditoModelo3D";

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
  title: "TECNOMOTOS · Trilha & Custom",
  description: "Sistema de gestão para oficina de motos de trilha e custom.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      className={`${inter.variable} ${archivoBlack.variable} h-full antialiased`}
    >
      <body className="relative min-h-full font-sans text-zinc-100">
        <TireTrackBackground />

        <header className="relative flex flex-col items-center gap-2 pb-6 pt-10">
          <SkullHeader3D />
          <h1 className="font-display text-3xl uppercase tracking-widest text-zinc-50">
            TECNOMOTOS
          </h1>
          <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">
            Trilha &amp; Custom
          </p>
        </header>

        <main className="relative mx-auto max-w-5xl px-4 pb-16">{children}</main>

        <footer className="relative pb-6">
          <CreditoModelo3D />
        </footer>
      </body>
    </html>
  );
}

