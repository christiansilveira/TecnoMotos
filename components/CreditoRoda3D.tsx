/**
 * Crédito exigido pela licença CC-BY-4.0 do modelo 3D usado em
 * <WheelBackground3D />. Mesmo padrão do <CreditoModelo3D /> que existia
 * pra caveira: discreto, mas sempre visível — a licença permite uso
 * comercial mas exige atribuição.
 */
export function CreditoRoda3D() {
  return (
    <p className="pointer-events-auto fixed bottom-1 left-1 z-[100] text-[9px] text-zinc-600">
      Roda 3D:{" "}
      <a
        href="https://sketchfab.com/3d-models/wheel-d8722e574a3d47218e3b1fb7c3d7ca31"
        target="_blank"
        rel="noopener noreferrer"
        className="underline hover:text-zinc-400"
      >
        litdani
      </a>{" "}
      · CC-BY-4.0
    </p>
  );
}
