import { corStatusTexto, STATUS_COR, STATUS_LABEL, type StatusOS } from "@/lib/tipos";
import { useBikerStore } from "@/store/useBikerStore";

export default function BadgeStatus({ status, tamanho = "sm" }: { status: StatusOS; tamanho?: "sm" | "md" }) {
  const tema = useBikerStore((s) => s.tema);
  const cor = STATUS_COR[status];
  const corTexto = corStatusTexto(cor, tema);
  const classeTamanho = tamanho === "sm" ? "text-[10px] px-2 py-0.5" : "text-xs px-2.5 py-1";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-bold uppercase tracking-wider ${classeTamanho}`}
      style={{ color: `rgb(${corTexto})`, background: `rgba(${cor}, .14)`, border: `1px solid rgba(${cor}, .4)` }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: `rgb(${corTexto})` }} />
      {STATUS_LABEL[status]}
    </span>
  );
}
