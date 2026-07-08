import { google, sheets_v4 } from "googleapis";
import { v4 as uuidv4 } from "uuid";
import { SHEET_SCHEMAS, type SheetName } from "./types";

type JWTClient = InstanceType<typeof google.auth.JWT>;

let sheetsClient: sheets_v4.Sheets | null = null;
let sheetIdCache: Map<string, number> | null = null;

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

async function getSheetIdByName(sheetName: SheetName): Promise<number> {
  if (sheetIdCache?.has(sheetName)) {
    return sheetIdCache.get(sheetName)!;
  }
  const client = getClient();
  const spreadsheetId = getSpreadsheetId();
  const meta = await client.spreadsheets.get({ spreadsheetId });
  sheetIdCache = new Map();
  for (const sheet of meta.data.sheets ?? []) {
    const title = sheet.properties?.title;
    const id = sheet.properties?.sheetId;
    if (title != null && id != null) {
      sheetIdCache.set(title, id);
    }
  }
  const found = sheetIdCache.get(sheetName);
  if (found == null) {
    throw new Error(
      `Aba "${sheetName}" não encontrada na planilha. Crie uma aba com esse nome exato.`
    );
  }
  return found;
}

async function ensureHeaders(sheetName: SheetName): Promise<string[]> {
  const client = getClient();
  const spreadsheetId = getSpreadsheetId();
  const headers = [...SHEET_SCHEMAS[sheetName]];

  const res = await client.spreadsheets.values.get({
    spreadsheetId,
    range: `${sheetName}!A1:Z1`,
  });

  const firstRow = res.data.values?.[0];
  if (!firstRow || firstRow.length === 0) {
    await client.spreadsheets.values.update({
      spreadsheetId,
      range: `${sheetName}!A1`,
      valueInputOption: "RAW",
      requestBody: { values: [headers] },
    });
    return headers;
  }
  return firstRow as string[];
}

/** Lê todas as linhas de uma aba como objetos { coluna: valor }, incluindo o número da linha real na planilha (base 1). */
export async function getRows<T extends Record<string, string>>(
  sheetName: SheetName
): Promise<Array<T & { _row: number }>> {
  const client = getClient();
  const spreadsheetId = getSpreadsheetId();
  const headers = await ensureHeaders(sheetName);

  const res = await client.spreadsheets.values.get({
    spreadsheetId,
    range: `${sheetName}!A2:Z`,
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
  const headers = await ensureHeaders(sheetName);

  const id = data.id || uuidv4();
  const row = headers.map((h) => (h === "id" ? id : data[h] ?? ""));

  await client.spreadsheets.values.append({
    spreadsheetId,
    range: `${sheetName}!A:Z`,
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
  const headers = await ensureHeaders(sheetName);
  const existing = await getRowById(sheetName, id);
  if (!existing) return false;

  const merged = headers.map((h) =>
    h === "id" ? id : updates[h] ?? (existing as Record<string, string>)[h] ?? ""
  );

  await client.spreadsheets.values.update({
    spreadsheetId,
    range: `${sheetName}!A${existing._row}:Z${existing._row}`,
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
  const gid = await getSheetIdByName(sheetName);

  await client.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: {
      requests: [
        {
          deleteDimension: {
            range: {
              sheetId: gid,
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
