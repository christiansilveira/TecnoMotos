import Link from "next/link";
import TrailPlateButton from "@/components/TrailPlateButton";

const PAINEIS = [
  { titulo: "Entrada de Veículos", descricao: "Receber uma moto e abrir ordem de serviço.", href: "/entrada" },
  { titulo: "Ordens de Serviço", descricao: "Acompanhar o que está em diagnóstico, execução e pronto.", href: "/ordens" },
  { titulo: "Dashboard", descricao: "Faturamento, OS abertas e giro de peças.", href: "/dashboard" },
  { titulo: "Estoque", descricao: "Peças da oficina, entrada por nota, cadastro rápido.", href: "/estoque" },
];

export default function Home() {
  return (
    <div className="flex flex-col gap-8 pt-4">
      <section className="grid gap-4 sm:grid-cols-2">
        {PAINEIS.map((painel) => (
          <Link key={painel.titulo} href={painel.href}>
            <article className="vidro-garagem h-full rounded-xl p-5 transition-transform hover:-translate-y-0.5 active:scale-[.98]">
              <h2 className="font-display text-lg uppercase tracking-wide text-zinc-50">
                {painel.titulo}
              </h2>
              <p className="mt-2 text-sm text-zinc-400">{painel.descricao}</p>
            </article>
          </Link>
        ))}
      </section>

      <section className="vidro-garagem flex flex-wrap items-center justify-center gap-4 rounded-xl p-6">
        <Link href="/entrada">
          <TrailPlateButton numero="07">Nova OS</TrailPlateButton>
        </Link>
        <Link href="/estoque">
          <TrailPlateButton numero="12">Ver Estoque</TrailPlateButton>
        </Link>
      </section>
    </div>
  );
}
