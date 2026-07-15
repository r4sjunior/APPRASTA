// Cria (uma única vez) a conta admin "cryptorastaadm" no Supabase Auth e o
// perfil correspondente em `profiles` (role='admin', status='aprovado').
//
// Uso:
//   node scripts/seed-admin.mjs <senha>
//
// Lê SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY do .env.local (ou do
// ambiente, se já exportadas). Rode depois de aplicar o supabase/schema.sql.

import { readFileSync, existsSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const ADMIN_USERNAME = "cryptorastaadm";
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
    const value = trimmed.slice(eq + 1).trim();
    if (!(key in process.env)) process.env[key] = value;
  }
}

async function main() {
  loadDotEnvLocal();

  const senha = process.argv[2];
  if (!senha || senha.length < 6) {
    console.error(
      "Uso: node scripts/seed-admin.mjs <senha>  (senha com pelo menos 6 caracteres)"
    );
    process.exit(1);
  }

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

  const { data: created, error: createErr } =
    await supabase.auth.admin.createUser({
      email: ADMIN_EMAIL,
      password: senha,
      email_confirm: true,
    });

  if (createErr) {
    console.error(`Erro ao criar usuário admin: ${createErr.message}`);
    process.exit(1);
  }

  const { error: profileErr } = await supabase.from("profiles").insert({
    id: created.user.id,
    role: "admin",
    status: "aprovado",
    email: ADMIN_EMAIL,
  });

  if (profileErr) {
    console.error(`Erro ao criar perfil admin: ${profileErr.message}`);
    process.exit(1);
  }

  console.log(
    `Conta admin criada. Faça login em /login com usuário "${ADMIN_USERNAME}" e a senha informada.`
  );
}

main();
