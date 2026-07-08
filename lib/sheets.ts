import { google, sheets_v4 } from "googleapis";
import { v4 as uuidv4 } from "uuid";
import { SHEET_SCHEMAS, type SheetName } from "./types";

type JWTClient = InstanceType<typeof google.auth.JWT>;
type SheetMeta = { title: string; sheetId: number };

let sheetsClient: sheets_v4.Sheets | null = null;
let sheetMetaCache: SheetMeta[] | null = null;

function getEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Variável de ambiente ${name} não configurada. Veja o .env.example.`
    );
  }
  return value;
}

function getAuth(): JWTClient {
  const email = getEnv("GOOGLE_SERVICE_ACCOUNT_EMAIL");
  const key = getEnv("GOOGLE_PRIVATE_KEY").replace(/\\n/g, "\n");
  return new google.auth.JWT({
    email,
    key,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
}

function getClient(): sheets_v4.Sheets {
  if (!sheetsClient) {
    sheetsClient = google.sheets({ version: "v4", auth: getAuth() });
  }
  return sheetsClient;
}

function getSpreadsheetId(): string {
  return getEnv("GOOGLE_SHEET_ID");
}

/** Normaliza um nome de aba para comparação tolerante a acento, caixa e espaços. */
const DIACRITICS_REGEX = new RegExp(
  "[" + String.fromCharCode(0x0300) + "-" + String.fromCharCode(0x036f) + "]",
  "g"
);

function normalizeTitle(s: string): string {
  return s
    .normalize("NFD")
    .replace(DIACRITICS_REGEX, "")
    .trim()
    .toLowerCase();
}

/** Envolve o nome real da aba em aspas simples para uso em notação A1 (necessário se tiver espaço/acento). */
function quoteTitle(title: string): string {
  return `'${title.replace(/'/g, "''")}'`;
}

async function getSpreadsheetMeta(): Promise<SheetMeta[]> {
  if (sheetMetaCache) return sheetMetaCache;
  const client = getClient();
  const spreadsheetId = getSpreadsheetId();
  const meta = await client.spreadsheets.get({ spreadsheetId });
  sheetMetaCache = (meta.data.sheets ?? []).map((s) => ({
    title: s.properties?.title ?? "",
    sheetId: s.properties?.sheetId ?? 0,
  }));
  return sheetMetaCache;
}

/** Encontra a aba real correspondente a um nome esperado (ex: "Movimentacoes"),
 * tolerando diferenças de acento, maiúscula/minúscula e espaços nas pontas. */
async function resolveSheet(sheetName: SheetName): Promise<SheetMeta> {
  const metas = await getSpreadsheetMeta();
  const target = normalizeTitle(sheetName);
  const found = metas.find((m) => normalizeTitle(m.title) === target);
  if (!found) {
    const disponiveis =
      metas.map((m) => `"${m.title}"`).join(", ") || "(nenhuma aba encontrada)";
    throw new Error(
      `Não encontrei uma aba equivalente a "${sheetName}" na planilha. ` +
        `Abas encontradas na planilha: ${disponiveis}. ` +
        `Renomeie uma delas para "${sheetName}".`
    );
  }
  return found;
}

async function ensureHeaders(
  sheetName: SheetName
): Promise<{ headers: string[]; title: string }> {
  const client = getClient();
  const spreadsheetId = getSpreadsheetId();
  const { title } = await resolveSheet(sheetName);
  const q = quoteTitle(title);
  const headers = [...SHEET_SCHEMAS[sheetName]];

  const res = await client.spreadsheets.values.get({
    spreadsheetId,
    range: `${q}!A1:Z1`,
  });

  const firstRow = res.data.values?.[0];
  if (!firstRow || firstRow.length === 0) {
    await client.spreadsheets.values.update({
      spreadsheetId,
      range: `${q}!A1`,
      valueInputOption: "RAW",
      requestBody: { values: [headers] },
    });
    return { headers, title };
  }
  return { headers: firstRow as string[], title };
}

/** Lê todas as linhas de uma aba como objetos { coluna: valor }, incluindo o número da linha real na planilha (base 1). */
export async function getRows<T extends Record<string, string>>(
  sheetName: SheetName
): Promise<Array<T & { _row: number }>> {
  const client = getClient();
  const spreadsheetId = getSpreadsheetId();
  const { headers, title } = await ensureHeaders(sheetName);
  const q = quoteTitle(title);

  const res = await client.spreadsheets.values.get({
    spreadsheetId,
    range: `${q}!A2:Z`,
  });

  const rows = res.data.values ?? [];
  return rows
    .map((row, index) => {
      const obj: Record<string, string> = {};
      headers.forEach((header, i) => {
        obj[header] = row[i] ?? "";
      });
      return { ...(obj as T), _row: index + 2 };
    })
    .filter((r) => Object.values(r).some((v) => v !== "" && v !== undefined));
}

export async function getRowById<T extends Record<string, string>>(
  sheetName: SheetName,
  id: string
): Promise<(T & { _row: number }) | null> {
  const rows = await getRows<T>(sheetName);
  return rows.find((r) => r.id === id) ?? null;
}

export async function appendRow(
  sheetName: SheetName,
  data: Record<string, string>
): Promise<string> {
  const client = getClient();
  const spreadsheetId = getSpreadsheetId();
  const { headers, title } = await ensureHeaders(sheetName);
  const q = quoteTitle(title);

  const id = data.id || uuidv4();
  const row = headers.map((h) => (h === "id" ? id : data[h] ?? ""));

  await client.spreadsheets.values.append({
    spreadsheetId,
    range: `${q}!A:Z`,
    valueInputOption: "USER_ENTERED",
    insertDataOption: "INSERT_ROWS",
    requestBody: { values: [row] },
  });

  return id;
}

export async function updateRowById(
  sheetName: SheetName,
  id: string,
  updates: Record<string, string>
): Promise<boolean> {
  const client = getClient();
  const spreadsheetId = getSpreadsheetId();
  const { headers, title } = await ensureHeaders(sheetName);
  const q = quoteTitle(title);
  const existing = await getRowById(sheetName, id);
  if (!existing) return false;

  const merged = headers.map((h) =>
    h === "id" ? id : updates[h] ?? (existing as Record<string, string>)[h] ?? ""
  );

  await client.spreadsheets.values.update({
    spreadsheetId,
    range: `${q}!A${existing._row}:Z${existing._row}`,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [merged] },
  });

  return true;
}

export async function deleteRowById(
  sheetName: SheetName,
  id: string
): Promise<boolean> {
  const existing = await getRowById(sheetName, id);
  if (!existing) return false;

  const client = getClient();
  const spreadsheetId = getSpreadsheetId();
  const { sheetId } = await resolveSheet(sheetName);

  await client.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: {
      requests: [
        {
          deleteDimension: {
            range: {
              sheetId,
              dimension: "ROWS",
              startIndex: existing._row - 1,
              endIndex: existing._row,
            },
          },
        },
      ],
    },
  });

  return true;
}
