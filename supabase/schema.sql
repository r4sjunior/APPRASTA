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

alter table produtos add column if not exists preco numeric not null default 0;
alter table produtos add column if not exists estoque_geral integer not null default 0;

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

-- Perfis de acesso (login) — 1:1 com auth.users do Supabase Auth.
-- O admin ("cryptorastaadm") é uma linha com role='admin' e status='aprovado',
-- criada uma única vez pelo scripts/seed-admin.mjs. Lojas se cadastram sozinhas
-- e nascem com status='pendente' até o admin aprovar (veja lib/auth.ts).
create table if not exists profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role text not null check (role in ('admin', 'loja')),
  status text not null default 'pendente' check (status in ('pendente', 'aprovado', 'recusado')),
  loja_id uuid references lojas (id) on delete set null,
  email text not null,
  created_at timestamptz not null default now()
);

create index if not exists profiles_loja_id_idx on profiles (loja_id);

create table if not exists pedidos (
  id uuid primary key default gen_random_uuid(),
  loja_id uuid not null references lojas (id) on delete restrict,
  status text not null default 'pendente' check (status in ('pendente', 'aprovado', 'recusado')),
  forma_pagamento text not null check (
    forma_pagamento in ('A_VISTA', 'ENTRADA_50_30D', 'SEM_ENTRADA_15D', 'SEM_ENTRADA_30D')
  ),
  valor_total numeric not null default 0,
  observacoes text not null default '',
  created_at timestamptz not null default now(),
  decidido_em timestamptz
);

create index if not exists pedidos_loja_id_idx on pedidos (loja_id);

create table if not exists pedido_itens (
  id uuid primary key default gen_random_uuid(),
  pedido_id uuid not null references pedidos (id) on delete cascade,
  produto_id uuid not null references produtos (id) on delete restrict,
  quantidade integer not null check (quantidade > 0),
  preco_unitario numeric not null default 0
);

create index if not exists pedido_itens_pedido_id_idx on pedido_itens (pedido_id);

create table if not exists pagamentos (
  id uuid primary key default gen_random_uuid(),
  pedido_id uuid not null references pedidos (id) on delete cascade,
  valor numeric not null default 0,
  vencimento date not null,
  status text not null default 'pendente' check (status in ('pendente', 'pago')),
  pago_em timestamptz
);

create index if not exists pagamentos_pedido_id_idx on pagamentos (pedido_id);

create table if not exists trocas_devolucoes (
  id uuid primary key default gen_random_uuid(),
  loja_id uuid not null references lojas (id) on delete restrict,
  pedido_id uuid references pedidos (id) on delete set null,
  produto_id uuid not null references produtos (id) on delete restrict,
  quantidade integer not null check (quantidade > 0),
  tipo text not null check (tipo in ('TROCA', 'DEVOLUCAO')),
  motivo text not null default '',
  status text not null default 'pendente' check (status in ('pendente', 'aprovado', 'recusado')),
  created_at timestamptz not null default now(),
  decidido_em timestamptz
);

create index if not exists trocas_devolucoes_loja_id_idx on trocas_devolucoes (loja_id);

-- Aprova um pedido de forma atômica: baixa o estoque geral, registra uma
-- movimentação de VENDA por item e gera as parcelas em `pagamentos` de
-- acordo com a forma de pagamento escolhida. `for update` trava as linhas de
-- produtos envolvidas, evitando vender o mesmo estoque duas vezes sob
-- aprovações concorrentes. Chamada pelo app via
-- `getClient().rpc("aprovar_pedido", { p_pedido_id })`.
create or replace function aprovar_pedido(p_pedido_id uuid)
returns void
language plpgsql
as $$
declare
  v_pedido pedidos%rowtype;
  v_item record;
  v_estoque integer;
  v_hoje date := current_date;
  v_entrada numeric;
begin
  select * into v_pedido from pedidos where id = p_pedido_id for update;
  if not found then
    raise exception 'Pedido não encontrado';
  end if;
  if v_pedido.status <> 'pendente' then
    raise exception 'Este pedido já foi decidido';
  end if;

  for v_item in select * from pedido_itens where pedido_id = p_pedido_id loop
    select estoque_geral into v_estoque from produtos where id = v_item.produto_id for update;
    if v_estoque is null or v_estoque < v_item.quantidade then
      raise exception 'Estoque insuficiente para o produto %', v_item.produto_id;
    end if;

    update produtos set estoque_geral = estoque_geral - v_item.quantidade
      where id = v_item.produto_id;

    insert into movimentacoes (loja_id, produto_id, quantidade, tipo, data, observacoes)
      values (v_pedido.loja_id, v_item.produto_id, v_item.quantidade, 'VENDA', v_hoje,
              'Pedido ' || p_pedido_id);
  end loop;

  if v_pedido.forma_pagamento = 'A_VISTA' then
    insert into pagamentos (pedido_id, valor, vencimento)
      values (p_pedido_id, v_pedido.valor_total, v_hoje);
  elsif v_pedido.forma_pagamento = 'ENTRADA_50_30D' then
    v_entrada := round(v_pedido.valor_total * 0.5, 2);
    insert into pagamentos (pedido_id, valor, vencimento) values
      (p_pedido_id, v_entrada, v_hoje),
      (p_pedido_id, v_pedido.valor_total - v_entrada, v_hoje + 30);
  elsif v_pedido.forma_pagamento = 'SEM_ENTRADA_15D' then
    insert into pagamentos (pedido_id, valor, vencimento)
      values (p_pedido_id, v_pedido.valor_total, v_hoje + 15);
  elsif v_pedido.forma_pagamento = 'SEM_ENTRADA_30D' then
    insert into pagamentos (pedido_id, valor, vencimento)
      values (p_pedido_id, v_pedido.valor_total, v_hoje + 30);
  end if;

  update pedidos set status = 'aprovado', decidido_em = now() where id = p_pedido_id;
end;
$$;
