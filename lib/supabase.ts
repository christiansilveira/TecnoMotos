import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/**
 * Verdadeiro enquanto as variáveis de ambiente do Supabase não
 * estiverem preenchidas. Nesse estado, as páginas usam os dados de
 * `lib/dados-demo.ts` em vez de consultar um banco de verdade — o app
 * abre e funciona mesmo sem projeto Supabase configurado ainda.
 */
export const DEMO = !SUPABASE_URL || !SUPABASE_ANON_KEY;

export const supabase = DEMO
  ? null
  : createClient(SUPABASE_URL as string, SUPABASE_ANON_KEY as string);
