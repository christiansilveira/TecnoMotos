import { STATUS_COR, STATUS_LABEL, type StatusOS } from "@/lib/tipos";

export default function BadgeStatus({ status, tamanho = "sm" }: { status: StatusOS; tamanho?: "sm" | "md" }) {
  const cor = STATUS_COR[status];
  const classeTamanho = tamanho === "sm" ? "text-[10px] px-2 py-0.5" : "text-xs px-2.5 py-1";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-bold uppercase tracking-wider ${classeTamanho}`}
      style={{ color: `rgb(${cor})`, background: `rgba(${cor}, .14)`, border: `1px solid rgba(${cor}, .4)` }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: `rgb(${cor})` }} />
      {STATUS_LABEL[status]}
    </span>
  );
}
