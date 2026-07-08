"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Loja } from "@/lib/types";

export function LojaForm({ loja }: { loja?: Loja }) {
  const router = useRouter();
  const [form, setForm] = useState({
    nome: loja?.nome ?? "",
    cidade: loja?.cidade ?? "",
    telefone: loja?.telefone ?? "",
    endereco: loja?.endereco ?? "",
  });
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    setSalvando(true);
    setErro(null);
    try {
      const url = loja ? `/api/lojas/${loja.id}` : "/api/lojas";
      const method = loja ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      router.push("/lojas");
      router.refresh();
    } catch (err) {
      setErro((err as Error).message);
    } finally {
      setSalvando(false);
    }
  }

  async function excluir() {
    if (!loja) return;
    if (!confirm(`Excluir "${loja.nome}"?`)) return;
    const res = await fetch(`/api/lojas/${loja.id}`, { method: "DELETE" });
    const data = await res.json();
    if (data.error) {
      setErro(data.error);
      return;
    }
    router.push("/lojas");
    router.refresh();
  }

  return (
    <form onSubmit={salvar} className="card max-w-lg space-y-4 p-6">
      <div>
        <label className="label">Nome da loja</label>
        <input
          className="input"
          required
          value={form.nome}
          onChange={(e) => setForm({ ...form, nome: e.target.value })}
        />
      </div>
      <div>
        <label className="label">Cidade</label>
        <input
          className="input"
          value={form.cidade}
          onChange={(e) => setForm({ ...form, cidade: e.target.value })}
        />
      </div>
      <div>
        <label className="label">Telefone</label>
        <input
          className="input"
          value={form.telefone}
          onChange={(e) => setForm({ ...form, telefone: e.target.value })}
        />
      </div>
      <div>
        <label className="label">Endereço</label>
        <input
          className="input"
          value={form.endereco}
          onChange={(e) => setForm({ ...form, endereco: e.target.value })}
        />
      </div>

      {erro && <p className="text-sm text-brand-red">{erro}</p>}

      <div className="flex items-center justify-between pt-2">
        <div className="flex gap-2">
          <button type="submit" disabled={salvando} className="btn-primary">
            {salvando ? "Salvando..." : "Salvar"}
          </button>
          <a href="/lojas" className="btn-secondary">
            Cancelar
          </a>
        </div>
        {loja && (
          <button type="button" onClick={excluir} className="btn-danger">
            Excluir
          </button>
        )}
      </div>
    </form>
  );
}
