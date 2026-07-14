-- Merch Control — schema do Supabase (Postgres).
-- Rode este arquivo inteiro no SQL Editor do painel do Supabase
-- (Project > SQL Editor > New query) antes de configurar as env vars do app.

create extension if not exists pgcrypto;

create table if not exists produtos (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  descricao text not null default '',
  categoria text not null default '',
  imagem_url text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists lojas (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  cidade text not null default '',
  telefone text not null default '',
  endereco text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists movimentacoes (
  id uuid primary key default gen_random_uuid(),
  loja_id uuid not null references lojas (id) on delete restrict,
  produto_id uuid not null references produtos (id) on delete restrict,
  quantidade integer not null check (quantidade > 0),
  tipo text not null check (tipo in ('CONSIGNADO', 'VENDA', 'DEVOLUCAO', 'REPOSICAO')),
  data date not null,
  observacoes text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists movimentacoes_loja_id_idx on movimentacoes (loja_id);
create index if not exists movimentacoes_produto_id_idx on movimentacoes (produto_id);

-- Observação: as chaves estrangeiras usam ON DELETE RESTRICT de propósito —
-- não é possível excluir uma loja ou produto que já tenha movimentações
-- registradas. O app traduz essa violação em uma mensagem de erro amigável
-- (veja lib/db.ts).
