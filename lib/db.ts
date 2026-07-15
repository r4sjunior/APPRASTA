import { createClient, type PostgrestError } from "@supabase/supabase-js";
import { NUMERIC_FIELDS, type TableName } from "./types";

function getEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Variável de ambiente ${name} não configurada. Veja o .env.example.`
    );
  }
  return value;
}

let client: ReturnType<typeof createClient> | null = null;

/** Client do Supabase com a service_role key — só roda em código de
 * servidor. Também usado por lib/auth.ts para a Admin API (createUser) e
 * para chamar RPCs de negócio (ex: aprovar_pedido). NUNCA passar este client
 * para `auth.signInWithPassword` — isso troca a sessão interna dele para a
 * do usuário autenticado, e todo select/insert seguinte nesse mesmo client
 * (inclusive em outras requisições, já que instâncias de função são
 * reaproveitadas) passa a rodar como esse usuário em vez de service_role,
 * fazendo leituras protegidas por RLS voltarem vazias. Use
 * `createAuthClient()` para isso. */
export function getClient() {
  if (!client) {
    client = createClient(
      getEnv("SUPABASE_URL"),
      getEnv("SUPABASE_SERVICE_ROLE_KEY"),
      { auth: { persistSession: false } }
    );
  }
  return client;
}

/** Client novo e descartável, só para `auth.signInWithPassword` — nunca é
 * reaproveitado, então a troca de sessão interna do client não vaza para
 * outras leituras/requisições (veja o comentário de getClient()). */
export function createAuthClient() {
  return createClient(
    getEnv("SUPABASE_URL"),
    getEnv("SUPABASE_SERVICE_ROLE_KEY"),
    { auth: { persistSession: false } }
  );
}

/** Converte os valores de uma linha do Postgres para string, para bater com
 * os tipos do app (que tratam todo campo como texto nos forms). */
function toStringRow<T extends Record<string, string>>(
  row: Record<string, unknown>
): T {
  const obj: Record<string, string> = {};
  for (const [key, value] of Object.entries(row)) {
    obj[key] = value === null || value === undefined ? "" : String(value);
  }
  return obj as T;
}

/** Converte os campos numéricos da tabela (ex: quantidade) de string para
 * number antes de gravar no Postgres. */
function toDbRow(
  table: TableName,
  data: Record<string, string>
): Record<string, unknown> {
  const row: Record<string, unknown> = { ...data };
  for (const field of NUMERIC_FIELDS[table]) {
    if (row[field] !== undefined && row[field] !== "") {
      row[field] = Number(row[field]);
    }
  }
  return row;
}

function friendlyError(err: PostgrestError): Error {
  if (err.code === "23503") {
    return new Error(
      "Não é possível excluir: existem movimentações vinculadas a este registro."
    );
  }
  return new Error(err.message);
}

export async function getRows<T extends Record<string, string>>(
  table: TableName
): Promise<T[]> {
  const { data, error } = await getClient().from(table).select("*");
  if (error) throw friendlyError(error);
  return (data ?? []).map((row) => toStringRow<T>(row));
}

/** Lê as linhas de uma tabela filtradas por uma coluna — usado pelas
 * páginas de loja para restringir a leitura aos próprios registros
 * (ex: getRowsBy("pedidos", "loja_id", lojaId)). */
export async function getRowsBy<T extends Record<string, string>>(
  table: TableName,
  column: string,
  value: string
): Promise<T[]> {
  const { data, error } = await getClient()
    .from(table)
    .select("*")
    .eq(column, value);
  if (error) throw friendlyError(error);
  return (data ?? []).map((row) => toStringRow<T>(row));
}

export async function getRowById<T extends Record<string, string>>(
  table: TableName,
  id: string
): Promise<T | null> {
  const { data, error } = await getClient()
    .from(table)
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw friendlyError(error);
  return data ? toStringRow<T>(data) : null;
}

export async function appendRow(
  table: TableName,
  data: Record<string, string>
): Promise<string> {
  const { id: _ignored, ...rest } = data;
  // Sem tipos gerados do schema do Supabase, o builder infere Insert/Update
  // como `never` — o `any` aqui contorna isso sem precisar gerar/manter
  // tipos do banco para este app pequeno.
  const { data: inserted, error } = await (getClient().from(table) as any)
    .insert(toDbRow(table, rest))
    .select("id")
    .single();
  if (error) throw friendlyError(error);
  return (inserted as { id: string }).id;
}

/** Insere uma linha com um `id` explícito (em vez de deixar o Postgres
 * gerar um) — usado só para `profiles`, cujo id precisa ser o mesmo do
 * usuário criado no Supabase Auth. */
export async function insertRowWithId(
  table: TableName,
  id: string,
  data: Record<string, string>
): Promise<void> {
  const { error } = await (getClient().from(table) as any).insert({
    id,
    ...toDbRow(table, data),
  });
  if (error) throw friendlyError(error);
}

export async function updateRowById(
  table: TableName,
  id: string,
  updates: Record<string, string>
): Promise<boolean> {
  const { id: _ignored, ...rest } = updates;
  const { data, error } = await (getClient().from(table) as any)
    .update(toDbRow(table, rest))
    .eq("id", id)
    .select("id");
  if (error) throw friendlyError(error);
  return (data?.length ?? 0) > 0;
}

export async function deleteRowById(
  table: TableName,
  id: string
): Promise<boolean> {
  const { data, error } = await getClient()
    .from(table)
    .delete()
    .eq("id", id)
    .select("id");
  if (error) throw friendlyError(error);
  return (data?.length ?? 0) > 0;
}
