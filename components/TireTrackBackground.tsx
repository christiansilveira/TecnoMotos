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

function gerarTrilha(largura: number, altura: number, fase: number): PontoTrilha[] {
  const pontos: PontoTrilha[] = [];
  const passos = 40;
  const inicioY = 0.05 + fase * 0.32;
  for (let i = 0; i <= passos; i++) {
    const t = i / passos;
    const x = -0.15 * largura + t * 1.3 * largura;
    const y = altura * (inicioY + 0.6 * t) + Math.sin(t * 6 + fase * 3) * 20;
    pontos.push({
      x,
      y,
      angulo: Math.atan2(0.6 * altura, 1.3 * largura) + Math.sin(t * 6 + fase * 3) * 0.12,
    });
  }
  return pontos;
}

const NUM_TRILHAS = 3;

/**
 * Fundo de canvas 2D, atrás de tudo: várias trilhas de pneu cravado
 * cruzando a tela, com poeira saindo delas o tempo todo. A intensidade
 * da poeira segue `dustIntensity` da useBikerStore — sobe quando
 * alguém aciona um boost (ex.: clique numa TrailPlateButton) e decai
 * sozinha até o repouso.
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
    let trilhas: PontoTrilha[][] = [];
    let quadro = 0;
    let particulas: Particula[] = [];
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const ajustarTamanho = () => {
      largura = canvas.clientWidth;
      altura = canvas.clientHeight;
      canvas.width = largura * dpr;
      canvas.height = altura * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      trilhas = Array.from({ length: NUM_TRILHAS }, (_, i) => gerarTrilha(largura, altura, i / NUM_TRILHAS));
    };
    ajustarTamanho();
    window.addEventListener("resize", ajustarTamanho);

    const desenharTrilha = (trilha: PontoTrilha[]) => {
      if (trilha.length === 0) return;
      ctx.save();
      ctx.strokeStyle = "rgba(255,255,255,0.06)";
      ctx.lineWidth = 20;
      ctx.lineCap = "round";
      ctx.beginPath();
      trilha.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
      ctx.stroke();

      ctx.strokeStyle = "rgba(0,0,0,0.32)";
      ctx.lineWidth = 3;
      trilha.forEach((p, i) => {
        if (i % 2 !== 0) return;
        const comprimento = 8;
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
      const trilha = trilhas[Math.floor(Math.random() * trilhas.length)];
      const p = trilha?.[Math.floor(Math.random() * trilha.length)];
      if (!p) return;
      particulas.push({
        x: p.x + (Math.random() - 0.5) * 18,
        y: p.y + (Math.random() - 0.5) * 18,
        vx: (Math.random() - 0.5) * 0.5,
        vy: -0.18 - Math.random() * 0.4,
        vida: 1,
        tamanho: 1 + Math.random() * 2.6,
      });
    };

    const desenharParticulas = (intensidade: number) => {
      const chanceEmissao = 0.35 + intensidade * 1.4;
      let restante = chanceEmissao;
      while (restante > 0) {
        if (Math.random() < Math.min(1, restante)) emitirParticula();
        restante -= 1;
      }

      particulas = particulas.filter((p) => p.vida > 0);
      if (particulas.length > 400) particulas = particulas.slice(-400);
      particulas.forEach((p) => {
        p.x += p.vx * (1 + intensidade * 2.6);
        p.y += p.vy * (1 + intensidade * 2.6);
        p.vida -= 0.011;
        ctx.beginPath();
        ctx.fillStyle = `rgba(214, 200, 180, ${Math.max(0, p.vida * 0.55)})`;
        ctx.arc(p.x, p.y, p.tamanho, 0, Math.PI * 2);
        ctx.fill();
      });
    };

    const laco = () => {
      ctx.clearRect(0, 0, largura, altura);
      trilhas.forEach(desenharTrilha);
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
