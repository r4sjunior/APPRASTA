# Merch Control

Recriação, fora do AppSheet, do app de controle de estoque consignado de merch
(CDs, vinis, camisetas, bonés, acessórios) distribuído para lojas parceiras.
Feito em **Next.js** usando **Supabase (Postgres + Auth)** como banco de
dados e sistema de login.

Dois papéis de acesso:

- **Admin** (`cryptorastaadm`) — login por usuário fixo + senha (sem
  e-mail). Cadastra produtos (com preço e estoque geral), aprova/recusa
  cadastros de loja, aprova/recusa pedidos e trocas/devoluções, marca
  parcelas como pagas, exporta relatórios (CSV) e acompanha um dashboard com
  ticket médio, PA (peças por atendimento), valor vendido no mês, valor a
  receber e valor já recebido.
- **Loja** — se cadastra em `/login` (aba "Criar conta") preenchendo e-mail,
  senha e os dados da loja; a conta fica **pendente** até o admin aprovar.
  Depois de aprovada, a loja vê o estoque disponível, faz pedidos
  informando a forma de pagamento (à vista; entrada de 50% + 50% em 30 dias;
  0 de entrada com prazo de 15 dias; 0 de entrada com prazo de 30 dias),
  acompanha status/histórico de pedidos, vê suas pendências de pagamento e
  solicita trocas/devoluções.

Entidades:

- **Produtos** — nome, descrição, categoria, imagem, preço, estoque geral
- **Lojas** — nome, cidade, telefone, endereço (preenchidos no cadastro)
- **Movimentações** — loja, produto, quantidade, tipo (CONSIGNADO, VENDA,
  DEVOLUCAO, REPOSICAO), data, observações — geradas automaticamente quando
  um pedido é aprovado (VENDA) ou uma troca/devolução é aprovada (DEVOLUCAO)
- **Pedidos** / **Itens do pedido** / **Pagamentos** — solicitação de compra
  de uma loja, com forma de pagamento e parcelas geradas na aprovação
- **Trocas/devoluções** — solicitação da loja referente a um produto (e,
  opcionalmente, a um pedido)

O dashboard do admin calcula automaticamente o **saldo consignado por
loja/produto** a partir do histórico de movimentações, além dos indicadores
financeiros acima.

## 1. Criar o projeto no Supabase

1. Crie uma conta e um projeto em [supabase.com](https://supabase.com/).
2. No painel do projeto, vá em **SQL Editor > New query**, cole o conteúdo de
   [`supabase/schema.sql`](./supabase/schema.sql) e rode. Isso cria as
   tabelas `produtos`, `lojas`, `movimentacoes`, `profiles`, `pedidos`,
   `pedido_itens`, `pagamentos`, `trocas_devolucoes` e a função
   `aprovar_pedido`.
3. Em **Authentication > Providers**, confira se "Email" está habilitado
   (é o padrão) — é usado tanto para o login das lojas quanto, internamente,
   para o login do admin.
4. Vá em **Project Settings > API** e copie:
   - **Project URL** → vai virar `SUPABASE_URL`
   - **service_role key** (na seção "Project API keys") → vai virar
     `SUPABASE_SERVICE_ROLE_KEY`

> ⚠️ A `service_role key` dá acesso total ao banco, ignorando qualquer regra
> de segurança (RLS). Ela só pode ser usada em código de servidor — nunca a
> prefixe com `NEXT_PUBLIC_` nem a exponha no client. Neste projeto ela só é
> lida em `lib/db.ts` e `lib/auth.ts`, que rodam exclusivamente em API
> routes, Server Components e no script `scripts/seed-admin.mjs`.

## 2. Configurar variáveis de ambiente localmente

Copie `.env.example` para `.env.local` e preencha:

```bash
cp .env.example .env.local
```

```env
SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

SESSION_SECRET=gere-um-valor-aleatorio-longo
```

`SESSION_SECRET` assina o cookie de sessão usado pelo login de admin/lojas
(gere com, por exemplo, `openssl rand -base64 32`).

## 3. Criar a conta admin (`cryptorastaadm`)

Depois de rodar o `schema.sql` e configurar o `.env.local`, crie a conta
admin uma única vez:

```bash
npm install
node scripts/seed-admin.mjs "senha-do-admin-aqui"
```

Isso cria o usuário `cryptorastaadm` no Supabase Auth (com um e-mail interno
que nunca aparece na tela de login) e o marca como admin já aprovado. Depois
disso, faça login em `/login` com usuário `cryptorastaadm` e a senha
escolhida.

## 4. Rodar localmente

```bash
npm install
npm run dev
```

Acesse `http://localhost:3000` — na tela de login do app, entre como admin
(`cryptorastaadm`) ou crie uma conta de loja pela aba "Criar conta".

## 5. Subir para o GitHub

```bash
git init
git add .
git commit -m "feat: login, contas de loja e fluxo de pedidos/trocas"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/merch-control.git
git push -u origin main
```

## 6. Deploy na Vercel

1. Acesse [vercel.com/new](https://vercel.com/new) e importe o repositório do
   GitHub.
2. O Next.js é detectado automaticamente — não precisa mudar nada no build.
3. Em **Environment Variables**, adicione as mesmas variáveis do
   `.env.local`:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `SESSION_SECRET`
4. Clique em **Deploy**.
5. Depois do primeiro deploy, rode `node scripts/seed-admin.mjs` localmente
   apontando para o mesmo projeto Supabase (ele já lê `.env.local`) — não é
   preciso rodar isso na Vercel.

Ou via CLI, depois de `npm i -g vercel`:

```bash
vercel link
vercel env add SUPABASE_URL
vercel env add SUPABASE_SERVICE_ROLE_KEY
vercel env add SESSION_SECRET
vercel --prod
```

## Estrutura do projeto

```
app/
  layout.tsx                 Layout raiz (html/body), sem Nav
  (auth)/layout.tsx          Layout das telas públicas (sem Nav)
  (auth)/login/page.tsx      Login (aba Entrar) + cadastro de loja (aba Criar conta)
  (auth)/pendente/page.tsx   Tela de status para loja pendente/recusada
  (app)/layout.tsx           Layout logado (Nav + conteúdo), lê a sessão
  (app)/page.tsx             Dashboard do admin (KPIs + saldo consignado)
  (app)/produtos/            Lista, cadastro e edição de produtos (preço, estoque geral)
  (app)/lojas/               Lista, cadastro e edição de lojas
  (app)/movimentacoes/       Lista, cadastro e edição de movimentações
  (app)/admin/usuarios/      Aprova/recusa cadastros de loja
  (app)/admin/pedidos/       Aprova/recusa pedidos, marca parcelas como pagas
  (app)/admin/trocas/        Aprova/recusa trocas/devoluções
  (app)/admin/relatorios/    Exporta CSV (financeiro, estoque, cadastros)
  (app)/loja/                Estoque disponível, pedidos, pagamentos, trocas (visão da loja)
  api/produtos, api/lojas, api/movimentacoes
                              Rotas REST (admin) que leem/gravam no Supabase
  api/auth/{login,signup,logout}
                              Autenticação (cookie de sessão)
  api/admin/{usuarios,pedidos,trocas,pagamentos,relatorios}
                              Ações do admin (aprovar/recusar/marcar pago/exportar)
  api/loja/{pedidos,trocas}  Criação de pedidos e solicitações de troca pela loja
lib/db.ts                    Client do Supabase + CRUD genérico
lib/auth.ts                  Sessão (cookie assinado), login e cadastro de loja
lib/types.ts                 Tipos das entidades e campos numéricos por tabela
components/                  Nav, formulários (Produto, Loja, Movimentação, Pedido, Troca) e login
supabase/schema.sql          Schema das tabelas + função aprovar_pedido (rodar no SQL Editor)
scripts/seed-admin.mjs       Cria a conta admin "cryptorastaadm" (rodar uma vez)
proxy.ts                     Checagem de login/papel (admin vs loja) e redirecionamentos
```
