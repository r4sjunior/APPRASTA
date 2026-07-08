# Merch Control

Recriação, fora do AppSheet, do app de controle de estoque consignado de merch
(CDs, vinis, camisetas, bonés, acessórios) distribuído para lojas parceiras.
Feito em **Next.js** usando o **Google Sheets** como banco de dados.

Entidades:

- **Produtos** — nome, descrição, categoria, imagem
- **Lojas** — nome, cidade, telefone, endereço
- **Movimentações** — loja, produto, quantidade, tipo (CONSIGNADO, VENDA,
  DEVOLUCAO, REPOSICAO), data, observações

O dashboard calcula automaticamente o **saldo consignado por loja/produto** a
partir do histórico de movimentações.

## 1. Criar a planilha do Google Sheets

1. Crie uma planilha nova no Google Sheets.
2. Renomeie as 3 primeiras abas exatamente como:
   - `Produtos`
   - `Lojas`
   - `Movimentacoes`
3. Não precisa criar os cabeçalhos manualmente — o app cria a primeira linha
   (`id`, `nome`, ...) sozinho na primeira vez que acessar cada aba vazia.
4. Copie o **ID da planilha** (o trecho da URL entre `/d/` e `/edit`):
   `https://docs.google.com/spreadsheets/d/ESSE_TRECHO_AQUI/edit`

## 2. Criar a conta de serviço (Service Account) do Google

1. Acesse o [Google Cloud Console](https://console.cloud.google.com/).
2. Crie um projeto (ou use um existente).
3. Ative a **Google Sheets API** em "APIs e serviços > Biblioteca".
4. Vá em "APIs e serviços > Credenciais" > "Criar credenciais" > **Conta de
   serviço**.
5. Após criar, abra a conta de serviço > aba "Chaves" > "Adicionar chave" >
   **Criar nova chave** > formato **JSON**. Um arquivo `.json` será baixado.
6. Abra o arquivo baixado e copie:
   - `client_email` → vai virar `GOOGLE_SERVICE_ACCOUNT_EMAIL`
   - `private_key` → vai virar `GOOGLE_PRIVATE_KEY`
7. **Compartilhe a planilha do Google Sheets** com o e-mail da conta de
   serviço (`client_email`), dando permissão de **Editor**. Sem esse passo o
   app não consegue ler nem escrever na planilha.

## 3. Configurar variáveis de ambiente localmente

Copie `.env.example` para `.env.local` e preencha:

```bash
cp .env.example .env.local
```

```env
GOOGLE_SERVICE_ACCOUNT_EMAIL=nome-da-conta@seu-projeto.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMII...\n-----END PRIVATE KEY-----\n"
GOOGLE_SHEET_ID=1AbCDefGhIjKLmnoPQRstuVwXYz
```

> Importante: `GOOGLE_PRIVATE_KEY` deve manter as quebras de linha como `\n`
> dentro de uma única string entre aspas, exatamente como vem no JSON baixado.

## 4. Rodar localmente

```bash
npm install
npm run dev
```

Acesse `http://localhost:3000`.

## 5. Subir para o GitHub

```bash
git init
git add .
git commit -m "feat: merch control app com Google Sheets"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/merch-control.git
git push -u origin main
```

## 6. Deploy na Vercel

1. Acesse [vercel.com/new](https://vercel.com/new) e importe o repositório do
   GitHub.
2. O Next.js é detectado automaticamente — não precisa mudar nada no build.
3. Em **Environment Variables**, adicione as mesmas 3 variáveis do
   `.env.local`:
   - `GOOGLE_SERVICE_ACCOUNT_EMAIL`
   - `GOOGLE_PRIVATE_KEY`
   - `GOOGLE_SHEET_ID`
4. Clique em **Deploy**.

Ou via CLI, depois de `npm i -g vercel`:

```bash
vercel link
vercel env add GOOGLE_SERVICE_ACCOUNT_EMAIL
vercel env add GOOGLE_PRIVATE_KEY
vercel env add GOOGLE_SHEET_ID
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
                             Rotas REST que leem/gravam no Google Sheets
lib/sheets.ts               Client do Google Sheets + CRUD genérico
lib/types.ts                Tipos e schema das abas
components/                 Nav e formulários (Produto, Loja, Movimentação)
```
