import { create } from "zustand";

interface BikerState {
  /** 0 = repouso, 1 = pico do "boost" (giro da caveira + poeira no máximo) */
  boost: number;
  /** Intensidade atual da poeira/fagulhas no fundo — decai junto com o boost, sem nunca zerar de vez. */
  dustIntensity: number;
  /** Dispara um pulso de boost. Chame isso a partir de qualquer interação (ex.: clique numa TrailPlateButton). */
  triggerBoost: () => void;
  /** true quando o AuthGate está mostrando a tela de entrar/criar conta — deixa o AppHeader saber que pode aumentar a logo e dar mais presença à marca antes de entrar no sistema. */
  telaLogin: boolean;
  setTelaLogin: (v: boolean) => void;
  /** De que lado da tela a roda 3D de fundo (WheelBackground3D) está agora — ela "corre" pro lado oposto a cada boost, ver triggerBoost. */
  ladoRoda: "esquerda" | "direita";
  /** Tema atual — "escuro" é o padrão histórico do app (garagem industrial); "claro" é a variante pedida pelo Christian (degradês azuis, detalhes pretos). Persiste em localStorage e é aplicado como atributo `data-theme` no <html> (ver script inline em app/layout.tsx, que evita flash de tema errado no primeiro paint). */
  tema: "escuro" | "claro";
  alternarTema: () => void;
  /** Só pra sincronizar o estado React com o que o script inline já
   * decidiu no DOM (ver <TemaSync />) — nunca chame isso fora dali. */
  definirTema: (t: "escuro" | "claro") => void;
}

const CHAVE_TEMA = "tecnomotos-tema";

const BOOST_MINIMO = 0.02;
const DECAIMENTO = 0.92;
const POEIRA_REPOUSO = 0.18;

/**
 * Store única para as interações do "universo biker": quando algo é
 * acionado na interface, o boost sobe para 1 e decai sozinho — os
 * componentes que dependem dele (a caveira 3D, a poeira do fundo)
 * apenas leem o valor atual a cada frame, sem precisar saber quem
 * disparou o boost nem quando ele termina.
 */
export const useBikerStore = create<BikerState>((set, get) => ({
  boost: 0,
  dustIntensity: POEIRA_REPOUSO,
  telaLogin: false,
  setTelaLogin: (v) => set({ telaLogin: v }),
  ladoRoda: "direita",
  // Sempre começa "escuro" aqui, IGUAL no servidor e no cliente — ler
  // document.documentElement.dataset.theme neste ponto (que o script
  // inline já cravou antes do React montar) causaria um valor diferente
  // do que o servidor renderizou, e o React descarta a árvore inteira
  // por "hydration mismatch". A sincronização com o que o script já
  // decidiu no DOM acontece depois, só no cliente, via <TemaSync />
  // (useEffect, roda só após a hidratação).
  tema: "escuro",
  definirTema: (t) => set({ tema: t }),

  alternarTema: () => {
    const proximo = get().tema === "escuro" ? "claro" : "escuro";
    set({ tema: proximo });
    if (typeof document !== "undefined") {
      document.documentElement.dataset.theme = proximo;
    }
    try {
      window.localStorage.setItem(CHAVE_TEMA, proximo);
    } catch {
      // localStorage pode falhar (modo privado, quota) — o tema só não
      // persiste entre sessões, não é motivo pra quebrar a troca em si.
    }
  },

  triggerBoost: () => {
    // A cada clique importante (qualquer TrailPlateButton/Card), a roda 3D
    // de fundo "corre" pro lado oposto da tela — pedido do Christian pra
    // reforçar a sensação de movimento junto com o boost visual existente.
    set((estado) => ({
      boost: 1,
      dustIntensity: 1,
      ladoRoda: estado.ladoRoda === "direita" ? "esquerda" : "direita",
    }));

    const decair = () => {
      const atual = get().boost;
      if (atual <= BOOST_MINIMO) {
        set({ boost: 0, dustIntensity: POEIRA_REPOUSO });
        return;
      }
      const proximo = atual * DECAIMENTO;
      set({ boost: proximo, dustIntensity: Math.max(POEIRA_REPOUSO, proximo) });
      requestAnimationFrame(decair);
    };

    requestAnimationFrame(decair);
  },
}));
