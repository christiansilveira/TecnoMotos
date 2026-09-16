/**
 * Crédito exigido pela licença CC-BY-4.0 do modelo 3D usado em
 * <SkullHeader3D />. A licença permite uso comercial mas exige
 * atribuição — por isso isto fica discreto, não some. Se quiser trocar
 * o modelo por um sem essa exigência mais pra frente, aí sim dá pra
 * tirar este componente do layout.
 */
export function CreditoModelo3D() {
  return (
    <p className="text-center text-[9px] text-zinc-600">
      Caveira 3D:{" "}
      <a
        href="https://sketchfab.com/3d-models/caveira-pirata-pirate-skull-6e1cd5e9352a457896f8c9b8ccea9d28"
        target="_blank"
        rel="noopener noreferrer"
        className="underline hover:text-zinc-400"
      >
        3 EIXOS
      </a>{" "}
      · CC-BY-4.0
    </p>
  );
}
