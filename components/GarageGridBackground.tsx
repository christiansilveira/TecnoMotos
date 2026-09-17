"use client";

import { useEffect, useRef } from "react";
import { useBikerStore } from "@/store/useBikerStore";

interface No {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

// Densidade reduzida depois que o WheelBackground3D entrou: a rede
// agora é só uma textura de apoio nas áreas vazias, não o elemento
// principal do fundo — era isso que o Christian achou "só num canto".
const DENSIDADE_MAX = 26;
const RAIO_CONEXAO = 140;

/**
 * Fundo de canvas 2D, atrás de tudo: uma rede de pontos conectados por
 * linhas finas que se refazem devagar — no espírito de um schematic/HUD
 * técnico (referência que o Christian trouxe: astrovia-solutions.vercel.app,
 * weevolveit.com — fundo quase preto + rede de partículas + acentos
 * geométricos finos) em vez do fundo anterior de "trilha de pneu com
 * poeira saindo", que ele achou clichê/amador — parecia clipart de
 * motocross em vez de um sistema de verdade.
 *
 * A cor é o âmbar da marca (não o ciano/rosa dos sites de referência —
 * a identidade de cor da TECNOMOTOS já está definida em STATUS_COR e
 * no botão de destaque, não faz sentido importar outra paleta junto
 * com a ideia). A intensidade de brilho/velocidade segue `dustIntensity`
 * da useBikerStore — o mesmo gancho tátil que os cliques em botões já
 * disparavam antes (era a poeira acelerando; agora é a rede "acordando").
 */
export default function GarageGridBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let largura = 0;
    let altura = 0;
    let nos: No[] = [];
    let quadro = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const reduzMovimento = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const ajustarTamanho = () => {
      largura = canvas.clientWidth;
      altura = canvas.clientHeight;
      canvas.width = largura * dpr;
      canvas.height = altura * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const area = largura * altura;
      const quantidade = Math.max(16, Math.min(DENSIDADE_MAX, Math.round(area / 28000)));
      nos = Array.from({ length: quantidade }, () => ({
        x: Math.random() * largura,
        y: Math.random() * altura,
        vx: (Math.random() - 0.5) * 0.12,
        vy: (Math.random() - 0.5) * 0.12,
      }));
    };
    ajustarTamanho();
    window.addEventListener("resize", ajustarTamanho);

    const desenhar = () => {
      const intensidade = reduzMovimento ? 0 : useBikerStore.getState().dustIntensity;
      ctx.clearRect(0, 0, largura, altura);

      if (!reduzMovimento) {
        nos.forEach((n) => {
          n.x += n.vx * (1 + intensidade * 1.8);
          n.y += n.vy * (1 + intensidade * 1.8);
          if (n.x < 0) n.x = largura;
          if (n.x > largura) n.x = 0;
          if (n.y < 0) n.y = altura;
          if (n.y > altura) n.y = 0;
        });
      }

      for (let i = 0; i < nos.length; i++) {
        for (let j = i + 1; j < nos.length; j++) {
          const a = nos[i];
          const b = nos[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < RAIO_CONEXAO) {
            const opacidade = (1 - dist / RAIO_CONEXAO) * (0.1 + intensidade * 0.16);
            ctx.strokeStyle = `rgba(255, 199, 0, ${opacidade})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }

      nos.forEach((n) => {
        ctx.beginPath();
        ctx.fillStyle = `rgba(255, 199, 0, ${0.32 + intensidade * 0.25})`;
        ctx.arc(n.x, n.y, 1.3, 0, Math.PI * 2);
        ctx.fill();
      });

      quadro = requestAnimationFrame(desenhar);
    };
    quadro = requestAnimationFrame(desenhar);

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
