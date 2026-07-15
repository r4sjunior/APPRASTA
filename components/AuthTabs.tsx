"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

function LoginForm() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [senha, setSenha] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function entrar(e: React.FormEvent) {
    e.preventDefault();
    setEnviando(true);
    setErro(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, senha }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      router.push(data.redirectTo);
      router.refresh();
    } catch (err) {
      setErro((err as Error).message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={entrar} className="space-y-4">
      <div>
        <label className="label">Usuário (admin) ou e-mail (loja)</label>
        <input
          className="input"
          required
          autoFocus
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
        />
      </div>
      <div>
        <label className="label">Senha</label>
        <input
          type="password"
          className="input"
          required
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
        />
      </div>

      {erro && <p className="text-sm text-brand-red">{erro}</p>}

      <button
        type="submit"
        disabled={enviando}
        className="btn-primary w-full"
      >
        {enviando ? "Entrando..." : "Entrar"}
      </button>
    </form>
  );
}

const INICIAL_LOJA = {
  nome: "",
  cidade: "",
  telefone: "",
  endereco: "",
};

const CAMPOS_LOJA: { key: keyof typeof INICIAL_LOJA; label: string }[] = [
  { key: "nome", label: "Nome da loja" },
  { key: "cidade", label: "Cidade" },
  { key: "telefone", label: "Telefone" },
  { key: "endereco", label: "Endereço" },
];

function SignupForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [loja, setLoja] = useState(INICIAL_LOJA);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function criarConta(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    if (senha !== confirmarSenha) {
      setErro("As senhas não conferem.");
      return;
    }
    setEnviando(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, senha, ...loja }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      router.push(data.redirectTo);
      router.refresh();
    } catch (err) {
      setErro((err as Error).message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={criarConta} className="space-y-4">
      <div>
        <label className="label">E-mail</label>
        <input
          type="email"
          className="input"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Senha</label>
          <input
            type="password"
            className="input"
            required
            minLength={6}
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
          />
        </div>
        <div>
          <label className="label">Confirmar senha</label>
          <input
            type="password"
            className="input"
            required
            minLength={6}
            value={confirmarSenha}
            onChange={(e) => setConfirmarSenha(e.target.value)}
          />
        </div>
      </div>

      <p className="pt-2 text-xs font-medium uppercase tracking-wide text-neutral-500">
        Dados da loja
      </p>
      {CAMPOS_LOJA.map((campo) => (
        <div key={campo.key}>
          <label className="label">{campo.label}</label>
          <input
            className="input"
            required
            value={loja[campo.key]}
            onChange={(e) =>
              setLoja({ ...loja, [campo.key]: e.target.value })
            }
          />
        </div>
      ))}

      {erro && <p className="text-sm text-brand-red">{erro}</p>}

      <button
        type="submit"
        disabled={enviando}
        className="btn-primary w-full"
      >
        {enviando ? "Enviando..." : "Criar conta"}
      </button>
      <p className="text-xs text-neutral-500">
        Sua conta fica pendente até o administrador aprovar o cadastro.
      </p>
    </form>
  );
}

export function AuthTabs() {
  const [aba, setAba] = useState<"entrar" | "criar">("entrar");

  return (
    <div className="card p-6">
      <div className="mb-6 flex gap-1 rounded-md bg-neutral-100 p-1">
        <button
          type="button"
          onClick={() => setAba("entrar")}
          className={`flex-1 rounded-md px-3 py-1.5 text-sm font-semibold transition ${
            aba === "entrar" ? "bg-white shadow-sm" : "text-neutral-500"
          }`}
        >
          Entrar
        </button>
        <button
          type="button"
          onClick={() => setAba("criar")}
          className={`flex-1 rounded-md px-3 py-1.5 text-sm font-semibold transition ${
            aba === "criar" ? "bg-white shadow-sm" : "text-neutral-500"
          }`}
        >
          Criar conta
        </button>
      </div>
      {aba === "entrar" ? <LoginForm /> : <SignupForm />}
    </div>
  );
}
