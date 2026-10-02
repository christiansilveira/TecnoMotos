"use client";

import { useBikerStore } from "@/store/useBikerStore";
import { IcoLua, IcoSol } from "./icones";

export default function TemaToggle() {
  const tema = useBikerStore((s) => s.tema);
  const alternarTema = useBikerStore((s) => s.alternarTema);
  const claro = tema === "claro";
  return (
    <button type="button" onClick={alternarTema} aria-label={claro ? "Mudar para tema escuro" : "Mudar para tema claro"} title={claro ? "Tema escuro" : "Tema claro"} className="icone-btn">
      {claro ? <IcoLua size={17} /> : <IcoSol size={17} />}
    </button>
  );
}
