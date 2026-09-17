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
}

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

  triggerBoost: () => {
    set({ boost: 1, dustIntensity: 1 });

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
