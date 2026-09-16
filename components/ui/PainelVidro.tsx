import type { HTMLAttributes } from "react";

/**
 * O cartão de vidro fosco padrão do app — usado em toda tela real
 * (Ordens, OS, Estoque, Dashboard). Mantém a classe `.vidro-garagem`
 * definida em globals.css como fonte única desse acabamento.
 */
export default function PainelVidro({
  className = "",
  children,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`vidro-garagem rounded-xl ${className}`} {...props}>
      {children}
    </div>
  );
}
