/**
 * CPF do cliente que assina a aprovação do orçamento na página pública
 * (app/aprovar/[id]) — pedido do Christian: guardar nome + CPF junto da
 * assinatura, pra registrar de verdade quem aprovou. Funções puras (sem
 * DOM), então servem tanto no formulário (client) quanto na rota que
 * confere antes de gravar (server).
 */

/** Formata os dígitos digitados como CPF (000.000.000-00) enquanto a
 * pessoa digita — sempre a partir dos dígitos crus, então cola/apaga no
 * meio do texto não bagunça a máscara. */
export function formatarCpf(valor: string): string {
  const digitos = valor.replace(/\D/g, "").slice(0, 11);
  let formatado = digitos.slice(0, 3);
  if (digitos.length > 3) formatado += "." + digitos.slice(3, 6);
  if (digitos.length > 6) formatado += "." + digitos.slice(6, 9);
  if (digitos.length > 9) formatado += "-" + digitos.slice(9, 11);
  return formatado;
}

/** Confere os dígitos verificadores do CPF (algoritmo oficial) — não é
 * só contar 11 números, porque isso vira uma assinatura registrada na
 * OS e não faz sentido aceitar qualquer sequência digitada. */
export function cpfValido(valor: string): boolean {
  const cpf = valor.replace(/\D/g, "");
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;

  const digitoVerificador = (tamanho: number) => {
    let soma = 0;
    for (let i = 0; i < tamanho; i++) soma += Number(cpf[i]) * (tamanho + 1 - i);
    const resto = (soma * 10) % 11;
    return resto === 10 ? 0 : resto;
  };

  return digitoVerificador(9) === Number(cpf[9]) && digitoVerificador(10) === Number(cpf[10]);
}
