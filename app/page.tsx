import Link from "next/link";
import TrailPlateCard from "@/components/TrailPlateCard";
import TrilhaDaMoto from "@/components/TrilhaDaMoto";
import { RevealGroup, RevealItem } from "@/components/ui/Reveal";

const PAINEIS = [
  { titulo: "Entrada de Veículos", descricao: "Receber uma moto e abrir ordem de serviço.", href: "/entrada", numero: "01" },
  { titulo: "Ordens de Serviço", descricao: "Acompanhar o que está em diagnóstico, execução e pronto.", href: "/ordens", numero: "02" },
  { titulo: "Dashboard", descricao: "Faturamento, OS abertas e giro de peças.", href: "/dashboard", numero: "03" },
  { titulo: "Estoque", descricao: "Peças da oficina, entrada por nota, cadastro rápido.", href: "/estoque", numero: "04" },
];

/**
 * Os 4 painéis da Home SÃO os botões grandes e principais do sistema —
 * por isso usam a placa metálica (`TrailPlateCard`) em vez do vidro
 * fosco genérico. Antes disso havia também um par de atalhos "Nova OS"
 * / "Ver Estoque" boiando num vidro separado embaixo — redundante com
 * os painéis de Entrada e Estoque logo acima, e é exatamente esse tipo
 * de botão pequeno solto que o Christian pediu pra tirar.
 */
export default function Home() {
  return (
    <RevealGroup className="flex flex-col gap-8 pt-4">
      <RevealItem>
        <TrilhaDaMoto />
      </RevealItem>

      <section className="grid gap-4 sm:grid-cols-2">
        {PAINEIS.map((painel) => (
          <RevealItem key={painel.titulo}>
            <Link href={painel.href}>
              <TrailPlateCard numero={painel.numero}>
                <h2 className="font-display text-lg uppercase tracking-wide text-zinc-900">
                  {painel.titulo}
                </h2>
                <p className="mt-2 text-sm text-zinc-700">{painel.descricao}</p>
              </TrailPlateCard>
            </Link>
          </RevealItem>
        ))}
      </section>
    </RevealGroup>
  );
}
