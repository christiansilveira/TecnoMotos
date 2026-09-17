"use client";

import type { InputHTMLAttributes } from "react";

type CampoProps = Omit<InputHTMLAttributes<HTMLInputElement>, "onChange"> & {
  label: string;
  onChange: (v: string) => void;
};

/**
 * Campo de formulário padrão do app — visual de "painel de instrumento"
 * em vez do input cinza genérico de formulário de SaaS: fundo mais fosco,
 * cantos discretos e uma linha de base que acende em âmbar no foco (o
 * mesmo âmbar do botão de destaque e da faixa de demo), como um mostrador
 * que reage quando você "pisa" nele.
 */
export default function Campo({ label, value, onChange, className = "", ...props }: CampoProps) {
  return (
    <label className="block">
      <span className="mb-2 block text-[11px] uppercase tracking-wide text-zinc-500">{label}</span>
      <input
        {...props}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`campo-instrumento w-full rounded-md border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-zinc-100 outline-none transition-colors placeholder:text-zinc-600 ${className}`}
      />
    </label>
  );
}
