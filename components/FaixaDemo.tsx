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
    <div className="relative z-30 bg-amber-400 py-2 text-center text-[11px] font-bold uppercase tracking-wide text-zinc-900">
      Modo demonstração — configure o Supabase para gravar de verdade
    </div>
  );
}
