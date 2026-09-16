/**
 * Crédito exigido pela licença CC-BY-4.0 do modelo 3D usado em
 * <SkullHeader3D />. Mantenha este componente visível em algum lugar
 * do app — a licença permite uso comercial, mas exige atribuição.
 */
export function CreditoModelo3D() {
  return (
    <p className="text-center text-[10px] leading-relaxed text-zinc-500">
      Modelo 3D:{" "}
      <a
        href="https://sketchfab.com/3d-models/caveira-pirata-pirate-skull-6e1cd5e9352a457896f8c9b8ccea9d28"
        target="_blank"
        rel="noopener noreferrer"
        className="underline hover:text-zinc-300"
      >
        &ldquo;Caveira Pirata &ndash; Pirate Skull&rdquo;
      </a>{" "}
      por{" "}
      <a
        href="https://sketchfab.com/3Eixos.xyz"
        target="_blank"
        rel="noopener noreferrer"
        className="underline hover:text-zinc-300"
      >
        3 EIXOS
      </a>
      , licença{" "}
      <a
        href="http://creativecommons.org/licenses/by/4.0/"
        target="_blank"
        rel="noopener noreferrer"
        className="underline hover:text-zinc-300"
      >
        CC-BY-4.0
      </a>
      .
    </p>
  );
}
