# Merch Control

Recriação, fora do AppSheet, do app de controle de estoque consignado de merch
(CDs, vinis, camisetas, bonés, acessórios) distribuído para lojas parceiras.
Feito em **Next.js** usando **Supabase (Postgres)** como banco de dados.

Entidades:

- **Produtos** — nome, descrição, categoria, imagem
- **Lojas** — nome, cidade, telefone, endereço
- **Movimentações** — loja, produto, quantidade, tipo (CONSIGNADO, VENDA,
  DEVOLUCAO, REPOSICAO), data, observações

O dashboard calcula automaticamente o **saldo consignado por loja/produto** a
partir do histórico de movimentações.

O app inteiro fica protegido por **HTTP Basic Auth** (usuário/senha únicos,
via variável de ambiente) — não há cadastro de usuários, é pensado para uso
interno da equipe.

## 1. Criar o projeto no Supabase

1. Crie uma conta e um projeto em [supabase.com](https://supabase.com/).
2. No painel do projeto, vá em **SQL Editor > New query**, cole o conteúdo de
   [`supabase/schema.sql`](./supabase/schema.sql) e rode. Isso cria as tabelas
   `produtos`, `lojas` e `movimentacoes`.
3. Vá em **Project Settings > API** e copie:
   - **Project URL** → vai virar `SUPABASE_URL`
   - **service_role key** (na seção "Project API keys") → vai virar
     `SUPABASE_SERVICE_ROLE_KEY`

> ⚠️ A `service_role key` dá acesso total ao banco, ignorando qualquer regra
> de segurança (RLS). Ela só pode ser usada em código de servidor — nunca a
> prefixe com `NEXT_PUBLIC_` nem a exponha no client. Neste projeto ela só é
> lida em `lib/db.ts`, que roda exclusivamente em API routes e Server
> Components.

## 2. Configurar variáveis de ambiente localmente

Copie `.env.example` para `.env.local` e preencha:

```bash
cp .env.example .env.local
```

```env
SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

APP_USER=admin
APP_PASSWORD=escolha-uma-senha-forte
```

`APP_USER`/`APP_PASSWORD` são a credencial do Basic Auth que protege o app —
o navegador vai pedir usuário e senha na primeira visita.

## 3. Rodar localmente

```bash
npm install
npm run dev
```

Acesse `http://localhost:3000` e informe o usuário/senha configurados.

## 4. Subir para o GitHub

```bash
git init
git add .
git commit -m "feat: merch control app com Supabase como banco de dados"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/merch-control.git
git push -u origin main
```

## 5. Deploy na Vercel

1. Acesse [vercel.com/new](https://vercel.com/new) e importe o repositório do
   GitHub.
2. O Next.js é detectado automaticamente — não precisa mudar nada no build.
3. Em **Environment Variables**, adicione as mesmas 4 variáveis do
   `.env.local`:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `APP_USER`
   - `APP_PASSWORD`
4. Clique em **Deploy**.

Ou via CLI, depois de `npm i -g vercel`:

```bash
vercel link
vercel env add SUPABASE_URL
vercel env add SUPABASE_SERVICE_ROLE_KEY
vercel env add APP_USER
vercel env add APP_PASSWORD
vercel --prod
```

## Estrutura do projeto

```
app/
  page.tsx                  Dashboard (contadores + saldo consignado)
  produtos/                 Lista, cadastro e edição de produtos
  lojas/                    Lista, cadastro e edição de lojas
  movimentacoes/            Lista, cadastro e edição de movimentações
  api/produtos, api/lojas, api/movimentacoes
                             Rotas REST que leem/gravam no Supabase
lib/db.ts                   Client do Supabase + CRUD genérico
lib/types.ts                Tipos das entidades e campos numéricos por tabela
components/                 Nav e formulários (Produto, Loja, Movimentação)
supabase/schema.sql          Schema das tabelas (rodar no SQL Editor do Supabase)
proxy.ts                      HTTP Basic Auth protegendo o app inteiro
```
