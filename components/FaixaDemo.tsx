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
    <div className="relative z-30 flex items-center justify-center gap-2 border-b border-amber-400/25 bg-[#0b0a06] py-1.5 text-center text-[10px] font-bold uppercase tracking-[0.14em] text-amber-400/90">
      <span aria-hidden="true" className="h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400 shadow-[0_0_6px_2px_rgba(251,191,36,0.55)]" />
      Modo demonstração — configure o Supabase para gravar de verdade
    </div>
  );
}
