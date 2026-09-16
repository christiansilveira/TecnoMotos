"use client";

import { useEffect, useRef } from "react";
import { useBikerStore } from "@/store/useBikerStore";

interface Particula {
  x: number;
  y: number;
  vx: number;
  vy: number;
  vida: number;
  tamanho: number;
}

interface PontoTrilha {
  x: number;
  y: number;
  angulo: number;
}

function gerarTrilha(largura: number, altura: number): PontoTrilha[] {
  const pontos: PontoTrilha[] = [];
  const passos = 40;
  for (let i = 0; i <= passos; i++) {
    const t = i / passos;
    const x = -0.1 * largura + t * 1.2 * largura;
    const y = altura * (0.12 + 0.75 * t) + Math.sin(t * 6) * 18;
    pontos.push({ x, y, angulo: Math.atan2(0.75 * altura, 1.2 * largura) + Math.sin(t * 6) * 0.12 });
  }
  return pontos;
}

/**
 * Fundo de canvas 2D, atrás de tudo: uma trilha de pneu cravado
 * cruzando a tela na diagonal, com poeira saindo dela o tempo todo.
 * A intensidade da poeira segue `dustIntensity` da useBikerStore —
 * sobe quando alguém aciona um boost (ex.: clique numa TrailPlateButton)
 * e decai sozinha até o repouso.
 */
export default function TireTrackBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let largura = 0;
    let altura = 0;
    let trilha: PontoTrilha[] = [];
    let quadro = 0;
    let particulas: Particula[] = [];
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const ajustarTamanho = () => {
      largura = canvas.clientWidth;
      altura = canvas.clientHeight;
      canvas.width = largura * dpr;
      canvas.height = altura * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      trilha = gerarTrilha(largura, altura);
    };
    ajustarTamanho();
    window.addEventListener("resize", ajustarTamanho);

    const desenharTrilha = () => {
      if (trilha.length === 0) return;
      ctx.save();
      ctx.strokeStyle = "rgba(255,255,255,0.045)";
      ctx.lineWidth = 22;
      ctx.lineCap = "round";
      ctx.beginPath();
      trilha.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
      ctx.stroke();

      ctx.strokeStyle = "rgba(0,0,0,0.3)";
      ctx.lineWidth = 3;
      trilha.forEach((p, i) => {
        if (i % 2 !== 0) return;
        const comprimento = 9;
        const nx = Math.cos(p.angulo + Math.PI / 2) * comprimento;
        const ny = Math.sin(p.angulo + Math.PI / 2) * comprimento;
        ctx.beginPath();
        ctx.moveTo(p.x - nx, p.y - ny);
        ctx.lineTo(p.x + nx, p.y + ny);
        ctx.stroke();
      });
      ctx.restore();
    };

    const emitirParticula = () => {
      const p = trilha[Math.floor(Math.random() * trilha.length)];
      if (!p) return;
      particulas.push({
        x: p.x + (Math.random() - 0.5) * 16,
        y: p.y + (Math.random() - 0.5) * 16,
        vx: (Math.random() - 0.5) * 0.4,
        vy: -0.15 - Math.random() * 0.35,
        vida: 1,
        tamanho: 1 + Math.random() * 2.2,
      });
    };

    const desenharParticulas = (intensidade: number) => {
      const chanceEmissao = 0.12 + intensidade * 0.85;
      if (Math.random() < chanceEmissao) emitirParticula();

      particulas = particulas.filter((p) => p.vida > 0);
      particulas.forEach((p) => {
        p.x += p.vx * (1 + intensidade * 2.4);
        p.y += p.vy * (1 + intensidade * 2.4);
        p.vida -= 0.012;
        ctx.beginPath();
        ctx.fillStyle = `rgba(214, 200, 180, ${Math.max(0, p.vida * 0.5)})`;
        ctx.arc(p.x, p.y, p.tamanho, 0, Math.PI * 2);
        ctx.fill();
      });
    };

    const laco = () => {
      ctx.clearRect(0, 0, largura, altura);
      desenharTrilha();
      const intensidade = useBikerStore.getState().dustIntensity;
      desenharParticulas(intensidade);
      quadro = requestAnimationFrame(laco);
    };
    quadro = requestAnimationFrame(laco);

    return () => {
      cancelAnimationFrame(quadro);
      window.removeEventListener("resize", ajustarTamanho);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 h-full w-full"
    />
  );
}
