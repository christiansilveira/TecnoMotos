export type StatusOS =
  | "recepcao"
  | "diagnostico"
  | "aguardando_aprovacao"
  | "aprovado"
  | "em_execucao"
  | "aguardando_peca"
  | "finalizado"
  | "entregue"
  | "cancelado";

export const STATUS_LABEL: Record<StatusOS, string> = {
  recepcao: "Recepção",
  diagnostico: "Diagnóstico",
  aguardando_aprovacao: "Aguardando cliente",
  aprovado: "Aprovado",
  em_execucao: "Em execução",
  aguardando_peca: "Aguardando peça",
  finalizado: "Finalizado",
  entregue: "Entregue",
  cancelado: "Cancelado",
};

/** Cor por família de status — ciano (diagnóstico), laranja (esperando
 * algo), roxo (em movimento), verde (concluído). */
export const STATUS_COR: Record<StatusOS, string> = {
  recepcao: "34 211 238",
  diagnostico: "34 211 238",
  aguardando_aprovacao: "251 146 60",
  aprovado: "168 85 247",
  em_execucao: "168 85 247",
  aguardando_peca: "251 146 60",
  finalizado: "74 222 128",
  entregue: "74 222 128",
  cancelado: "248 113 113",
};

export const COLUNAS_KANBAN: StatusOS[] = [
  "recepcao",
  "diagnostico",
  "aguardando_aprovacao",
  "aprovado",
  "em_execucao",
  "aguardando_peca",
  "finalizado",
];

export interface Cliente {
  id: string;
  nome: string;
  telefone: string | null;
}

export interface Veiculo {
  id: string;
  placa: string;
  marca: string | null;
  modelo: string | null;
  ano: number | null;
  km_atual: number | null;
  documento: string | null;
}

export interface OrdemServico {
  id: string;
  numero: number;
  status: StatusOS;
  km_entrada: number | null;
  relato_cliente: string | null;
  diagnostico: string | null;
  valor_pecas: number;
  valor_servicos: number;
  valor_desconto: number;
  valor_total: number;
  aberta_em: string;
  finalizada_em: string | null;
  entregue_em: string | null;
  veiculo_id: string;
  cliente_id: string | null;
  veiculos?: Pick<Veiculo, "placa" | "marca" | "modelo" | "ano"> | null;
  clientes?: Pick<Cliente, "nome" | "telefone"> | null;
}

export interface ItemOS {
  id: string;
  os_id: string;
  tipo: "peca" | "servico";
  descricao: string;
  quantidade: number;
  valor_unit: number;
}

export interface Produto {
  id: string;
  nome: string;
  sku: string | null;
  preco_venda: number;
  preco_custo: number;
  estoque_min: number;
  unidade: string;
  ativo: boolean;
  saldo: number;
  situacao: "ok" | "critico" | "zerado";
}

export function brl(valor: number | null | undefined): string {
  return (Number(valor) || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

/** Horas parado vira nível de urgência (0 a 3), igual ao app original. */
export function urgencia(os: Pick<OrdemServico, "status" | "aberta_em">): 0 | 1 | 2 | 3 {
  if (["entregue", "cancelado", "finalizado"].includes(os.status)) return 0;
  const horas = (Date.now() - new Date(os.aberta_em).getTime()) / 36e5;
  if (horas > 72) return 3;
  if (horas > 24) return 2;
  return 1;
}
