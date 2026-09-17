"use client";

import { useEffect } from "react";
import { useBikerStore } from "@/store/useBikerStore";

/**
 * Sincroniza o estado React (`tema` na useBikerStore) com o que o
 * script inline no <head> já decidiu no DOM antes da hidratação — ver
 * app/layout.tsx (SCRIPT_TEMA) e a store (por que o valor inicial da
 * store é sempre "escuro", igual no servidor). Roda só num useEffect
 * (cliente, pós-hidratação), então não invisível/não deixa flash: o
 * CSS de tema claro já se aplica pelo atributo `data-theme` puro no
 * `<html>` desde o primeiro paint — isso aqui só atualiza os pedaços
 * que dependem de `tema` em React (ícone do TemaToggle, cor da rede de
 * partículas, textos de status), que não têm como saber do atributo
 * sozinhos.
 */
export default function TemaSync() {
  const definirTema = useBikerStore((s) => s.definirTema);

  useEffect(() => {
    const atual = document.documentElement.dataset.theme;
    if (atual === "claro" || atual === "escuro") definirTema(atual);
  }, [definirTema]);

  return null;
}
