/**
 * Decoração estática de "painel técnico": dois cantos de mira nos
 * vértices da tela. Puro CSS, sem JS — é o acento geométrico fino que
 * a referência do Christian (astrovia-solutions, weevolveit) usa em
 * vez de textura literal. Fica sempre atrás de tudo (z-index negativo
 * definido nas próprias classes em globals.css).
 *
 * O anel de mostrador que ficava aqui (.hud-mostrador, ainda definido
 * em globals.css) foi retirado da renderização — competia com o pneu
 * 3D (WheelBackground3D), que agora ocupa esse mesmo canto e cumpre
 * melhor esse papel.
 */
export default function HudDecoracao() {
  return (
    <>
      <span aria-hidden="true" className="hud-canto hud-canto-tl" />
      <span aria-hidden="true" className="hud-canto hud-canto-br" />
    </>
  );
}
