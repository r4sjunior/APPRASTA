"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Produto } from "@/lib/types";

const CATEGORIAS = ["CD/Vinil", "Vestuário", "Acessórios", "Outros"];

export function ProdutoForm({ produto }: { produto?: Produto }) {
  const router = useRouter();
  const [form, setForm] = useState({
    nome: produto?.nome ?? "",
    descricao: produto?.descricao ?? "",
    categoria: produto?.categoria ?? CATEGORIAS[0],
    imagem_url: produto?.imagem_url ?? "",
  });
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    setSalvando(true);
    setErro(null);
    try {
      const url = produto ? `/api/produtos/${produto.id}` : "/api/produtos";
      const method = produto ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      router.push("/produtos");
      router.refresh();
    } catch (err) {
      setErro((err as Error).message);
    } finally {
      setSalvando(false);
    }
  }

  async function excluir() {
    if (!produto) return;
    if (!confirm(`Excluir "${produto.nome}"?`)) return;
    const res = await fetch(`/api/produtos/${produto.id}`, { method: "DELETE" });
    const data = await res.json();
    if (data.error) {
      setErro(data.error);
      return;
    }
    router.push("/produtos");
    router.refresh();
  }

  return (
    <form onSubmit={salvar} className="card max-w-lg space-y-4 p-6">
      <div>
        <label className="label">Nome</label>
        <input
          className="input"
          required
          value={form.nome}
          onChange={(e) => setForm({ ...form, nome: e.target.value })}
        />
      </div>
      <div>
        <label className="label">Descrição</label>
        <textarea
          className="input"
          rows={3}
          value={form.descricao}
          onChange={(e) => setForm({ ...form, descricao: e.target.value })}
        />
      </div>
      <div>
        <label className="label">Categoria</label>
        <select
          className="input"
          value={form.categoria}
          onChange={(e) => setForm({ ...form, categoria: e.target.value })}
        >
          {CATEGORIAS.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="label">URL da imagem</label>
        <input
          className="input"
          placeholder="https://..."
          value={form.imagem_url}
          onChange={(e) => setForm({ ...form, imagem_url: e.target.value })}
        />
      </div>

      {erro && <p className="text-sm text-brand-red">{erro}</p>}

      <div className="flex items-center justify-between pt-2">
        <div className="flex gap-2">
          <button type="submit" disabled={salvando} className="btn-primary">
            {salvando ? "Salvando..." : "Salvar"}
          </button>
          <a href="/produtos" className="btn-secondary">
            Cancelar
          </a>
        </div>
        {produto && (
          <button type="button" onClick={excluir} className="btn-danger">
            Excluir
          </button>
        )}
      </div>
    </form>
  );
}
