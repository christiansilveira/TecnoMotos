"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useBikerStore } from "@/store/useBikerStore";
import { NAV, rotaAtiva } from "./icones";

/** Barra de navegação flutuante no celular — o uso no pátio é com uma
 * mão só, então as 5 áreas ficam ao alcance do polegar. No computador
 * os mesmos links aparecem na barra do topo (AppHeader). */
export default function NavInferior() {
  const pathname = usePathname();
  const telaLogin = useBikerStore((s) => s.telaLogin);
  if (telaLogin || pathname?.startsWith("/aprovar/")) return null;
  return (
    <nav
      aria-label="Navegação principal"
      className="nav-baixo fixed inset-x-3 z-40 grid grid-cols-5 rounded-[22px] p-1.5 sm:hidden"
      style={{ bottom: "max(12px, env(safe-area-inset-bottom))" }}
    >
      {NAV.map(({ href, rotulo, Ico }) => {
        const ativo = rotaAtiva(pathname, href);
        return (
          <Link key={href} href={href} aria-current={ativo ? "page" : undefined} className={`nav-item flex flex-col items-center gap-0.5 py-1 text-[10.5px] font-semibold ${ativo ? "ativo" : ""}`}>
            <span className="nav-ico grid h-8 w-12 place-items-center rounded-full">
              <Ico size={19} />
            </span>
            {rotulo}
          </Link>
        );
      })}
    </nav>
  );
}
