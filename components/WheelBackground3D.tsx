"use client";

import { Suspense, useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, useGLTF } from "@react-three/drei";
import { motion } from "motion/react";
import { Box3, PerspectiveCamera, type Group, Vector3 } from "three";
import { useBikerStore } from "@/store/useBikerStore";

const CAMINHO_MODELO = "/models/wheel.glb";

// Largura (em unidades de mundo, no plano da roda) que fica visível na
// largura do painel — controla o quão "grande"/preenchida a roda
// aparece. Interpolado pelo aspect ratio do container (ver função
// abaixo): num painel bem estreito e alto (celular), dá pra "chegar
// mais perto" (valor menor) porque sobra muita altura de sobra — a
// roda passa a preencher bem mais da largura do painel, em troca de um
// corte natural em cima/embaixo (ela já nasceu pensada como "cortada
// pela borda da tela", não como um elemento que precisa caber inteiro
// sem cortar nada). Num painel mais largo (desktop), a roda já ocupa
// boa parte da largura sem precisar desse zoom.
const ALVO_MOBILE = { aspecto: 0.28, largura: 1.85 };
const ALVO_DESKTOP = { aspecto: 0.8, largura: 3.0 };

function larguraVisivelAlvo(aspecto: number): number {
  const t = (aspecto - ALVO_MOBILE.aspecto) / (ALVO_DESKTOP.aspecto - ALVO_MOBILE.aspecto);
  const tClampado = Math.min(1, Math.max(0, t));
  return ALVO_MOBILE.largura + (ALVO_DESKTOP.largura - ALVO_MOBILE.largura) * tClampado;
}

/**
 * O painel da roda é metade da tela — no celular isso dá um recorte bem
 * estreito e ALTO (ex.: ~180px de largura por ~800px de altura). O
 * `fov` do `<Canvas>` é sempre o campo de visão VERTICAL do three.js; num
 * recorte estreito como esse, o campo de visão HORIZONTAL correspondente
 * (fov vertical × aspect) fica minúsculo — a câmera acaba enxergando só
 * uma fatia vertical bem fina da roda, ampliada, o que na prática
 * aparecia como um "flash" de reflexo de cromado em vez da roda inteira
 * (era exatamente o bug que o Christian reportou: "roda cortada"/"flash
 * de luz no meio da tela"). Esse componente recalcula o `fov` a cada
 * redimensionamento pra manter fixa a LARGURA horizontal visível — isso
 * garante que a roda sempre fique reconhecível de lado a lado, não
 * importa o quão estreito o painel fique.
 *
 * Primeira versão usava uma largura-alvo fixa grande o bastante pra
 * roda inteira caber com folga — resolvia o "flash", mas criava um
 * problema novo: num painel bem alto e estreito (celular), isso deixa
 * a roda "certinha" mas minúscula (o painel tem MUITO mais altura que
 * largura, e a roda, sendo redonda, fica do tamanho da largura —
 * pequena contra uma tela tão alta). `larguraVisivelAlvo` interpola
 * esse valor pelo aspect: quanto mais estreito o painel, menor a
 * largura-alvo (mais "zoom"), deixando a roda visivelmente maior —
 * ela passa a vazar um pouco por cima/baixo do painel, o que é normal
 * pro estilo do fundo (nasceu pra ser "cortada pela borda da tela").
 */
function AjustarCameraAoContainer() {
  const { camera, size } = useThree();

  useEffect(() => {
    if (!(camera instanceof PerspectiveCamera)) return;
    const aspecto = size.width / size.height;
    const distancia = camera.position.z;
    const meiaLarguraAlvo = larguraVisivelAlvo(aspecto) / 2;
    const fovHorizontalRad = 2 * Math.atan(meiaLarguraAlvo / distancia);
    const fovVerticalRad = 2 * Math.atan(Math.tan(fovHorizontalRad / 2) / aspecto);
    camera.fov = (fovVerticalRad * 180) / Math.PI;
    camera.aspect = aspecto;
    camera.updateProjectionMatrix();
  }, [camera, size]);

  return null;
}

/**
 * Roda real, não mais procedural: o Christian baixou ele mesmo o .glb do
 * modelo do Sketchfab que tinha mandado de referência
 * (https://sketchfab.com/3d-models/wheel-d8722e574a3d47218e3b1fb7c3d7ca31,
 * autor litdani/cheoo, CC-BY-4.0) e mandou o arquivo direto — resolve o
 * problema de login que tínhamos antes (por isso a primeira versão era
 * modelada do zero). Crédito obrigatório da licença fica em
 * <CreditoRoda3D />, sempre visível.
 *
 * O export do Sketchfab não vem com origin nem eixo de giro "limpos" (a
 * translação crua dos nós fica a ~2.7 unidades do zero da cena). Em vez
 * de cravar números manualmente, centralizamos pela bounding box em
 * runtime e giramos em torno da dimensão mais fina da caixa (a
 * "espessura" do pneu = o eixo do aro) com `rotateOnAxis` — isso gira a
 * roda em torno do próprio eixo físico dela, então continua parecendo
 * rodar mesmo com a inclinação estática por cima (visão 3/4, não de
 * frente achatada).
 */
function Roda() {
  const { scene } = useGLTF(CAMINHO_MODELO);
  const grupoGiro = useRef<Group>(null);
  const eixoLocal = useRef(new Vector3(0, 1, 0));

  const modelo = useMemo(() => scene.clone(true), [scene]);

  useEffect(() => {
    const caixa = new Box3().setFromObject(modelo);
    const centro = new Vector3();
    const tamanho = new Vector3();
    caixa.getCenter(centro);
    caixa.getSize(tamanho);

    // Recentraliza a geometria na origem do grupo de giro.
    modelo.position.set(-centro.x, -centro.y, -centro.z);

    // O eixo do aro é a dimensão mais fina da caixa.
    const dims = [tamanho.x, tamanho.y, tamanho.z];
    const eixoMenor = dims.indexOf(Math.min(...dims));
    const eixo = new Vector3(eixoMenor === 0 ? 1 : 0, eixoMenor === 1 ? 1 : 0, eixoMenor === 2 ? 1 : 0);
    eixoLocal.current = eixo;

    if (grupoGiro.current) {
      // Inclinação estática pra ver a roda em 3/4 — "como se estivesse
      // na estrada", não de frente achatada tipo moeda.
      grupoGiro.current.quaternion.setFromUnitVectors(eixo, new Vector3(0.55, 0.22, 0.8).normalize());

      const maiorDim = Math.max(tamanho.x, tamanho.y, tamanho.z) || 1;
      grupoGiro.current.scale.setScalar(2.7 / maiorDim);
    }
  }, [modelo]);

  useFrame((_estado, delta) => {
    if (!grupoGiro.current) return;
    const boost = useBikerStore.getState().boost;
    // gira em torno do próprio eixo do aro — acelera no boost
    grupoGiro.current.rotateOnAxis(eixoLocal.current, delta * (0.5 + boost * 3));
  });

  return (
    <group ref={grupoGiro}>
      <primitive object={modelo} />
    </group>
  );
}

useGLTF.preload(CAMINHO_MODELO);

/**
 * Painel de metade da tela com a roda 3D girando, atrás de tudo. Antes
 * era um fundo cheio de tela com uma máscara suavizando tudo — o
 * Christian achou pouco presente ("só num canto") e pediu explicitamente
 * pra ocupar "literalmente metade da tela". Agora é isso: um painel
 * fixo de 50% de largura, altura cheia, com uma máscara só bem colada
 * na borda interna (perto do conteúdo) pra não cravar uma linha dura no
 * meio da tela.
 *
 * A cada boost (clique em qualquer TrailPlateButton/Card pelo app — ver
 * useBikerStore.triggerBoost), o painel "corre" pro lado oposto da tela
 * com uma mola do Framer Motion — o pedido dele foi literal: "quando
 * clicarmos em algo ela corra para o outro lado da tela".
 */
export default function WheelBackground3D() {
  const ladoRoda = useBikerStore((s) => s.ladoRoda);

  // A borda que "cola" no centro da tela (perto do conteúdo) é sempre a
  // borda interna do painel, que troca de lado conforme ele desliza.
  // Fade só bem no finalzinho (90% → 100%) — antes começava em 78% e
  // "comia" quase um quarto da roda; o pedido foi pra ela aparecer
  // inteira, ficando opaca só na pontinha final.
  const mascara =
    ladoRoda === "esquerda"
      ? "linear-gradient(to right, black 0%, black 90%, transparent 100%)"
      : "linear-gradient(to left, black 0%, black 90%, transparent 100%)";

  return (
    <motion.div
      aria-hidden="true"
      className="pointer-events-none fixed inset-y-0 left-0 z-[-11] w-1/2 opacity-90"
      style={{ maskImage: mascara, WebkitMaskImage: mascara }}
      animate={{ x: ladoRoda === "direita" ? "100%" : "0%" }}
      transition={{ type: "spring", stiffness: 70, damping: 16, mass: 1.2 }}
    >
      <Canvas dpr={[1, 1.6]} camera={{ position: [0, 0, 5.2], fov: 34 }} gl={{ alpha: true, antialias: true }}>
        <AjustarCameraAoContainer />
        <ambientLight intensity={0.45} />
        <directionalLight position={[3, 4, 5]} intensity={1.3} color="#fff4e0" />
        <directionalLight position={[-4, -1, -3]} intensity={0.6} color="#ffb347" />
        <directionalLight position={[0.5, 0.5, 6]} intensity={0.7} color="#ffffff" />
        <Suspense fallback={null}>
          <Roda />
          <Environment preset="city" environmentIntensity={0.6} />
        </Suspense>
      </Canvas>
    </motion.div>
  );
}
