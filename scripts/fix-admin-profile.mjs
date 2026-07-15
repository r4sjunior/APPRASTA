// Repara a conta admin quando ela já existe no Supabase Auth mas está sem
// linha em `profiles` (mensagem "Conta autenticada mas sem perfil
// configurado"). Diferente do seed-admin.mjs, este script NÃO cria um novo
// usuário — apenas localiza o usuário "cryptorastaadm@admin.local" existente
// e faz upsert do perfil (role='admin', status='aprovado').
//
// Uso:
//   node scripts/fix-admin-profile.mjs
//
// Lê SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY do .env.local (ou do ambiente).

import { readFileSync, existsSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const ADMIN_EMAIL = "cryptorastaadm@admin.local";

function loadDotEnvLocal() {
  const path = new URL("../.env.local", import.meta.url);
  if (!existsSync(path)) return;
  const content = readFileSync(path, "utf8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = value;
  }
}

async function findUserByEmail(supabase, email) {
  let page = 1;
  const perPage = 200;
  for (;;) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage,
    });
    if (error) throw new Error(`Erro ao listar usuários: ${error.message}`);
    const found = data.users.find(
      (u) => u.email?.toLowerCase() === email.toLowerCase()
    );
    if (found) return found;
    if (data.users.length < perPage) return null;
    page += 1;
  }
}

async function main() {
  loadDotEnvLocal();

  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    console.error(
      "Defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY em .env.local antes de rodar este script."
    );
    process.exit(1);
  }

  const supabase = createClient(url, serviceRoleKey, {
    auth: { persistSession: false },
  });

  const user = await findUserByEmail(supabase, ADMIN_EMAIL);
  if (!user) {
    console.error(
      `Nenhum usuário com e-mail ${ADMIN_EMAIL} encontrado no Supabase Auth.\n` +
        `Rode "node scripts/seed-admin.mjs <senha>" para criar a conta do zero.`
    );
    process.exit(1);
  }

  console.log(`Usuário admin encontrado (id=${user.id}). Verificando perfil...`);

  const { data: existingProfile, error: fetchErr } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (fetchErr) {
    console.error(`Erro ao consultar perfil existente: ${fetchErr.message}`);
    process.exit(1);
  }

  if (existingProfile) {
    console.log(
      `Perfil já existe (role=${existingProfile.role}, status=${existingProfile.status}). Nada a fazer.`
    );
    if (existingProfile.role !== "admin" || existingProfile.status !== "aprovado") {
      console.log(
        "Aviso: o perfil existe mas não está como role=admin/status=aprovado. " +
          "Corrija manualmente se isso não for esperado."
      );
    }
    return;
  }

  const { error: insertErr } = await supabase.from("profiles").insert({
    id: user.id,
    role: "admin",
    status: "aprovado",
    email: ADMIN_EMAIL,
  });

  if (insertErr) {
    console.error(`Erro ao criar perfil admin: ${insertErr.message}`);
    process.exit(1);
  }

  console.log(
    'Perfil admin criado com sucesso (role="admin", status="aprovado"). ' +
      "Faça login novamente em /login."
  );
}

main();
