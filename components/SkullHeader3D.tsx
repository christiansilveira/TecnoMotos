"use client";

import { Suspense, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, PresentationControls, useGLTF } from "@react-three/drei";
import { motion } from "motion/react";
import type { Group } from "three";
import { useBikerStore } from "@/store/useBikerStore";

const CAMINHO_MODELO = "/models/skull/scene.gltf";

function Caveira() {
  const grupo = useRef<Group>(null);
  const { scene } = useGLTF(CAMINHO_MODELO);

  useFrame((_estado, delta) => {
    if (!grupo.current) return;
    const boost = useBikerStore.getState().boost;
    // giro contínuo de base — nunca para — mais um pico temporário no boost
    grupo.current.rotation.y += delta * (0.4 + boost * 3.2);
  });

  return <primitive ref={grupo} object={scene} scale={1.95} position={[0, -0.35, 0]} />;
}

/**
 * Caveira biker 3D no topo do header — o "troféu" que gira sozinho o
 * tempo todo e acelera ("boost") quando alguém aciona uma
 * TrailPlateButton em qualquer lugar do app.
 *
 * PresentationControls permite um leve arrasto/tilt com o mouse ou o
 * dedo por cima do giro automático — os dois efeitos se somam porque
 * atuam em transforms diferentes (o controle gira o grupo pai, o giro
 * contínuo gira o objeto dentro dele).
 *
 * Modelo: "Caveira Pirata – Pirate Skull" por 3 EIXOS (Sketchfab),
 * licença CC-BY-4.0. Crédito completo em <CreditoModelo3D />, que
 * deve continuar visível no app — é exigência da licença.
 */
export default function SkullHeader3D() {
  // Na tela de login a logo já cresce pra dar presença de marca — a
  // caveira encolhe pra virar um selo ao lado dela em vez de competir
  // por espaço vertical (era o que empurrava o botão de entrar pra
  // fora da tela em celulares menores).
  const telaLogin = useBikerStore((s) => s.telaLogin);

  return (
    <motion.div
      className={`relative mx-auto transition-[width,height] duration-500 ${
        telaLogin ? "h-28 w-28" : "h-56 w-56 sm:h-72 sm:w-72"
      }`}
      initial={{ opacity: 0, scale: 0.7, rotate: -8 }}
      animate={{ opacity: 1, scale: 1, rotate: 0 }}
      transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
    >
      {/* Holofote atrás do troféu — dá palco pra caveira em vez de deixá-la
          flutuando sozinha no vazio do degradê. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(255,199,0,0.16) 0%, rgba(255,199,0,0.07) 35%, transparent 70%)",
          filter: "blur(2px)",
        }}
      />
      <Canvas camera={{ position: [0, 0, 4.6], fov: 35 }} dpr={[1, 2]}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[3, 4, 5]} intensity={1.4} color="#fff4e0" />
        <directionalLight position={[-4, -2, -3]} intensity={0.5} color="#4060ff" />
        <Suspense fallback={null}>
          <PresentationControls global speed={1.2} zoom={1} polar={[-0.2, 0.2]} azimuth={[-0.4, 0.4]}>
            <Caveira />
          </PresentationControls>
          <Environment preset="city" />
        </Suspense>
      </Canvas>
    </motion.div>
  );
}

useGLTF.preload(CAMINHO_MODELO);
