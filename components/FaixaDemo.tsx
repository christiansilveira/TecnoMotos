import { DEMO } from "@/lib/supabase";

/**
 * Avisa claramente quando o app está rodando sem Supabase configurado.
 * Sem isso, é fácil preencher um formulário, "salvar" e não entender
 * por que nada aparece depois — porque, em modo demonstração, não tem
 * banco de verdade por trás.
 */
export default function FaixaDemo() {
  if (!DEMO) return null;
  return (
    <div className="relative z-50 flex items-center justify-center gap-2 border-b border-white/5 bg-black/60 px-4 py-1.5 text-center text-[11px] font-medium text-zinc-400">
      <span aria-hidden="true" className="h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400 shadow-[0_0_6px_2px_rgba(251,191,36,0.5)]" />
      Modo demonstração · os dados não são gravados
    </div>
  );
}
