"use client";

/** Cabeçalho da Home: saudação pela hora + data por extenso. O servidor
 * não sabe o fuso de quem abre, então o texto pode mudar na hidratação
 * (suppressHydrationWarning de propósito). */
export default function Saudacao() {
  const agora = new Date();
  const h = agora.getHours();
  const oi = h < 12 ? "Bom dia" : h < 18 ? "Boa tarde" : "Boa noite";
  const data = agora.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" });
  return (
    <div>
      <p suppressHydrationWarning className="font-mono text-[11px] uppercase tracking-[0.2em] text-zinc-500">{data}</p>
      <h1 suppressHydrationWarning className="font-display mt-1 text-[26px] uppercase leading-tight text-zinc-50 sm:text-4xl">{oi}, oficina</h1>
    </div>
  );
}
