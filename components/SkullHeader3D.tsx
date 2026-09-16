"use client";

import { Suspense, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, PresentationControls, useGLTF } from "@react-three/drei";
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
  return (
    <div className="mx-auto h-56 w-56 sm:h-72 sm:w-72">
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
    </div>
  );
}

useGLTF.preload(CAMINHO_MODELO);
