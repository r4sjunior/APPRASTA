import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import {
  getClient,
  createAuthClient,
  getRowById,
  appendRow,
  insertRowWithId,
} from "./db";
import type { Profile, Role, StatusConta } from "./types";

/** O admin não usa e-mail: na tela de login ele só digita "cryptorastaadm" +
 * senha. Por baixo dos panos ele é uma conta comum do Supabase Auth, com
 * este e-mail interno fixo (nunca exibido, nunca usado para enviar nada). */
export const ADMIN_USERNAME = "cryptorastaadm";
export const ADMIN_EMAIL = "cryptorastaadm@admin.local";

const SESSION_COOKIE = "session";
const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 dias

function getSecret(): Uint8Array {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error(
      "Variável de ambiente SESSION_SECRET não configurada. Veja o .env.example."
    );
  }
  return new TextEncoder().encode(secret);
}

export type SessionPayload = {
  sub: string;
  role: Role;
  status: StatusConta;
  lojaId: string | null;
};

async function setSessionCookie(payload: SessionPayload): Promise<void> {
  const token = await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(getSecret());

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}

/** Valida o token do cookie de sessão. Retorna `null` se ausente/expirado/
 * inválido — nunca lança. Usado tanto em Server Components/Route Handlers
 * (via getSession) quanto no proxy.ts (que lê o cookie da request direto,
 * sem acesso a next/headers). */
export async function verifySessionToken(
  token: string | undefined
): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export const SESSION_COOKIE_NAME = SESSION_COOKIE;

/** Lê e valida a sessão do cookie. Retorna `null` se não houver sessão ou se
 * o token for inválido/expirado — nunca lança. */
export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  return verifySessionToken(cookieStore.get(SESSION_COOKIE)?.value);
}

export async function clearSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

function credenciaisInvalidas(): Error {
  return new Error("Usuário/e-mail ou senha inválidos.");
}

/** Faz login e grava o cookie de sessão do app. `identifier` pode ser um
 * e-mail (contas de loja) ou o usuário fixo do admin ("cryptorastaadm"). */
export async function login(
  identifier: string,
  senha: string
): Promise<Profile> {
  const trimmed = identifier.trim();
  let email: string;
  if (trimmed.includes("@")) {
    email = trimmed.toLowerCase();
  } else if (trimmed.toLowerCase() === ADMIN_USERNAME) {
    email = ADMIN_EMAIL;
  } else {
    throw credenciaisInvalidas();
  }

  const { data, error } = await createAuthClient().auth.signInWithPassword({
    email,
    password: senha,
  });
  if (error || !data.user) throw credenciaisInvalidas();

  const profile = await getRowById<Profile>("profiles", data.user.id);
  if (!profile) {
    throw new Error(
      "Conta autenticada mas sem perfil configurado. Contate o administrador."
    );
  }

  await setSessionCookie({
    sub: profile.id,
    role: profile.role as Role,
    status: profile.status as StatusConta,
    lojaId: profile.loja_id || null,
  });

  return profile;
}

export type SignupInput = {
  email: string;
  senha: string;
  nome: string;
  cidade: string;
  telefone: string;
  endereco: string;
};

/** Cria a conta de uma loja: usuário no Supabase Auth + linha em `lojas` +
 * linha em `profiles` (status inicial "pendente", aguardando aprovação do
 * admin). Se algum passo depois de criar o usuário do Auth falhar, o
 * usuário é removido para não deixar uma conta órfã sem perfil/loja. */
export async function signup(input: SignupInput): Promise<Profile> {
  const email = input.email.trim().toLowerCase();
  if (!email.includes("@")) {
    throw new Error("Informe um e-mail válido.");
  }
  if (email === ADMIN_EMAIL || email === ADMIN_USERNAME) {
    throw new Error("Este e-mail não pode ser usado.");
  }
  if (!input.senha || input.senha.length < 6) {
    throw new Error("A senha deve ter pelo menos 6 caracteres.");
  }
  for (const campo of ["nome", "cidade", "telefone", "endereco"] as const) {
    if (!input[campo]?.trim()) {
      throw new Error("Preencha todos os campos da loja.");
    }
  }

  const { data, error } = await getClient().auth.admin.createUser({
    email,
    password: input.senha,
    email_confirm: true,
  });
  if (error || !data.user) {
    if (error?.message?.toLowerCase().includes("already")) {
      throw new Error("Já existe uma conta com este e-mail.");
    }
    throw new Error(error?.message ?? "Não foi possível criar a conta.");
  }

  const userId = data.user.id;
  try {
    const lojaId = await appendRow("lojas", {
      nome: input.nome.trim(),
      cidade: input.cidade.trim(),
      telefone: input.telefone.trim(),
      endereco: input.endereco.trim(),
    });
    await insertRowWithId("profiles", userId, {
      role: "loja",
      status: "pendente",
      loja_id: lojaId,
      email,
    });
  } catch (err) {
    await getClient()
      .auth.admin.deleteUser(userId)
      .catch(() => {});
    throw err;
  }

  const profile = await getRowById<Profile>("profiles", userId);
  if (!profile) throw new Error("Não foi possível concluir o cadastro.");

  await setSessionCookie({
    sub: profile.id,
    role: profile.role as Role,
    status: profile.status as StatusConta,
    lojaId: profile.loja_id || null,
  });

  return profile;
}

/** Rota para onde mandar o usuário logo após login/cadastro, de acordo com
 * papel e status da conta. */
export function redirectPathFor(profile: Profile): string {
  if (profile.role === "admin") return "/";
  if (profile.status === "aprovado") return "/loja";
  return "/pendente";
}
