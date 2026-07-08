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

export const SHEET_SCHEMAS = {
  Produtos: ["id", "nome", "descricao", "categoria", "imagem_url"],
  Lojas: ["id", "nome", "cidade", "telefone", "endereco"],
  Movimentacoes: [
    "id",
    "loja_id",
    "produto_id",
    "quantidade",
    "tipo",
    "data",
    "observacoes",
  ],
} as const;

export type SheetName = keyof typeof SHEET_SCHEMAS;
