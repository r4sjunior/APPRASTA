export type Produto = {
  id: string;
  nome: string;
  descricao: string;
  categoria: string;
  imagem_url: string;
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

export type TableName = "produtos" | "lojas" | "movimentacoes";

/** Campos numéricos por tabela — precisam ser convertidos antes de gravar no Postgres. */
export const NUMERIC_FIELDS: Record<TableName, string[]> = {
  produtos: [],
  lojas: [],
  movimentacoes: ["quantidade"],
};
