import type { CSSProperties, HTMLAttributes } from "react";

interface PainelVidroProps extends HTMLAttributes<HTMLDivElement> {
  /** RGB "r g b" (mesmo formato de STATUS_COR) — quando presente, o
   * card ganha a faixa colorida na borda esquerda (.faixa-status) em
   * vez de depender só de um badge solto pra indicar status. */
  corStatus?: string;
}

/**
 * O cartão de vidro fosco padrão do app — usado em toda tela real
 * (Ordens, OS, Estoque, Dashboard). Mantém a classe `.vidro-garagem`
 * definida em globals.css como fonte única desse acabamento.
 */
export default function PainelVidro({
  className = "",
  children,
  corStatus,
  style,
  ...props
}: PainelVidroProps) {
  return (
    <div
      className={`vidro-garagem rounded-xl ${corStatus ? "faixa-status" : ""} ${className}`}
      style={corStatus ? ({ "--cor-status": corStatus, ...style } as CSSProperties) : style}
      {...props}
    >
      {children}
    </div>
  );
}
