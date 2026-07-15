export type Produto = {
  id: string;
  nome: string;
  descricao: string;
  categoria: string;
  imagem_url: string;
  preco: string;
  estoque_geral: string;
};

export type Loja = {
  id: string;
  nome: string;
  cidade: string;
  telefone: string;
  endereco: string;
};

export const TIPOS_MOVIMENTACAO = [
  "CONSIGNADO",
  "VENDA",
  "DEVOLUCAO",
  "REPOSICAO",
] as const;

export type TipoMovimentacao = (typeof TIPOS_MOVIMENTACAO)[number];

export type Movimentacao = {
  id: string;
  loja_id: string;
  produto_id: string;
  quantidade: string;
  tipo: TipoMovimentacao | string;
  data: string;
  observacoes: string;
};

export type Role = "admin" | "loja";

export type StatusConta = "pendente" | "aprovado" | "recusado";

export type Profile = {
  id: string;
  role: Role | string;
  status: StatusConta | string;
  loja_id: string;
  email: string;
};

export const STATUS_PEDIDO = ["pendente", "aprovado", "recusado"] as const;
export type StatusPedido = (typeof STATUS_PEDIDO)[number];

export const FORMAS_PAGAMENTO = [
  "A_VISTA",
  "ENTRADA_50_30D",
  "SEM_ENTRADA_15D",
  "SEM_ENTRADA_30D",
] as const;

export type FormaPagamento = (typeof FORMAS_PAGAMENTO)[number];

export const FORMAS_PAGAMENTO_LABEL: Record<FormaPagamento, string> = {
  A_VISTA: "À vista",
  ENTRADA_50_30D: "Entrada 50% + 50% em 30 dias",
  SEM_ENTRADA_15D: "0 de entrada, prazo de 15 dias",
  SEM_ENTRADA_30D: "0 de entrada, prazo de 30 dias",
};

export type Pedido = {
  id: string;
  loja_id: string;
  status: StatusPedido | string;
  forma_pagamento: FormaPagamento | string;
  valor_total: string;
  observacoes: string;
  created_at: string;
  decidido_em: string;
};

export type PedidoItem = {
  id: string;
  pedido_id: string;
  produto_id: string;
  quantidade: string;
  preco_unitario: string;
};

export type StatusPagamento = "pendente" | "pago";

export type Pagamento = {
  id: string;
  pedido_id: string;
  valor: string;
  vencimento: string;
  status: StatusPagamento | string;
  pago_em: string;
};

export const TIPOS_TROCA = ["TROCA", "DEVOLUCAO"] as const;
export type TipoTroca = (typeof TIPOS_TROCA)[number];

export type TrocaDevolucao = {
  id: string;
  loja_id: string;
  pedido_id: string;
  produto_id: string;
  quantidade: string;
  tipo: TipoTroca | string;
  motivo: string;
  status: StatusPedido | string;
  created_at: string;
  decidido_em: string;
};

export type TableName =
  | "produtos"
  | "lojas"
  | "movimentacoes"
  | "profiles"
  | "pedidos"
  | "pedido_itens"
  | "pagamentos"
  | "trocas_devolucoes";

/** Campos numéricos por tabela — precisam ser convertidos antes de gravar no Postgres. */
export const NUMERIC_FIELDS: Record<TableName, string[]> = {
  produtos: ["preco", "estoque_geral"],
  lojas: [],
  movimentacoes: ["quantidade"],
  profiles: [],
  pedidos: ["valor_total"],
  pedido_itens: ["quantidade", "preco_unitario"],
  pagamentos: ["valor"],
  trocas_devolucoes: ["quantidade"],
};
