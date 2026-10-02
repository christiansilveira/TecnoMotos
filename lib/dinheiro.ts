/** Lê valor digitado: "R$ 30", "30,50", "1.250,00", "30.5".
 * Com "%" devolve o percentual sobre `base` (ex.: "10%" de 300 = 30). */
export function lerValor(v: string, base = 0): number {
  let t = String(v ?? "").trim();
  if (!t) return 0;
  const pct = t.includes("%");
  t = t.replace(/[^\d.,-]/g, "");
  if (t.includes(",")) t = t.replace(/\./g, "").replace(",", ".");
  else if ((t.match(/\./g) || []).length > 1 || /\.\d{3}$/.test(t)) t = t.replace(/\./g, "");
  const n = Math.max(0, Number(t) || 0);
  return pct ? Math.round(base * n) / 100 : n;
}
