import type { ReactNode } from "react";
import { IcoChave } from "../icones";

/** Tela vazia ilustrada: ícone em "bolha" com brilho do acento, título,
 * texto de apoio e (opcional) um botão de ação — nunca só um texto solto. */
export default function Vazio({ icone, titulo, texto, acao }: { icone?: ReactNode; titulo: string; texto?: string; acao?: ReactNode }) {
  return (
    <div className="px-6 py-10 text-center">
      <span className="vazio-arte" aria-hidden="true">{icone ?? <IcoChave size={30} />}</span>
      <p className="font-display text-base uppercase text-zinc-100">{titulo}</p>
      {texto && <p className="mx-auto mt-1.5 max-w-xs text-sm text-zinc-400">{texto}</p>}
      {acao && <div className="mt-5 flex justify-center">{acao}</div>}
    </div>
  );
}
