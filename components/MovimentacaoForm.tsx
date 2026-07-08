"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { Movimentacao, Produto, Loja } from "@/lib/types";
import { TIPOS_MOVIMENTACAO } from "@/lib/types";

function hoje() {
  return new Date().toISOString().slice(0, 10);
}

export function MovimentacaoForm({ movimentacao }: { movimentacao?: Movimentacao }) {
  const router = useRouter();
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [lojas, setLojas] = useState<Loja[]>([]);
  const [form, setForm] = useState({
    loja_id: movimentacao?.loja_id ?? "",
    produto_id: movimentacao?.produto_id ?? "",
    quantidade: movimentacao?.quantidade ?? "1",
    tipo: movimentacao?.tipo ?? TIPOS_MOVIMENTACAO[0],
    data: movimentacao?.data ?? hoje(),
    observacoes: movimentacao?.observacoes ?? "",
  });
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/produtos").then((r) => r.json()).then(setProdutos);
    fetch("/api/lojas").then((r) => r.json()).then(setLojas);
  }, []);

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    setSalvando(true);
    setErro(null);
    try {
      const url = movimentacao
        ? `/api/movimentacoes/${movimentacao.id}`
        : "/api/movimentacoes";
      const method = movimentacao ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      router.push("/movimentacoes");
      router.refresh();
    } catch (err) {
      setErro((err as Error).message);
    } finally {
      setSalvando(false);
    }
  }

  async function excluir() {
    if (!movimentacao) return;
    if (!confirm("Excluir esta movimentação?")) return;
    const res = await fetch(`/api/movimentacoes/${movimentacao.id}`, {
      method: "DELETE",
    });
    const data = await res.json();
    if (data.error) {
      setErro(data.error);
      return;
    }
    router.push("/movimentacoes");
    router.refresh();
  }

  return (
    <form onSubmit={salvar} className="card max-w-lg space-y-4 p-6">
      <div>
        <label className="label">Loja</label>
        <select
          className="input"
          required
          value={form.loja_id}
          onChange={(e) => setForm({ ...form, loja_id: e.target.value })}
        >
          <option value="">Selecione...</option>
          {lojas.map((l) => (
            <option key={l.id} value={l.id}>
              {l.nome}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="label">Produto</label>
        <select
          className="input"
          required
          value={form.produto_id}
          onChange={(e) => setForm({ ...form, produto_id: e.target.value })}
        >
          <option value="">Selecione...</option>
          {produtos.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nome}
            </option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Quantidade</label>
          <input
            type="number"
            min={1}
            className="input"
            required
            value={form.quantidade}
            onChange={(e) => setForm({ ...form, quantidade: e.target.value })}
          />
        </div>
        <div>
          <label className="label">Tipo de movimentação</label>
          <select
            className="input"
            value={form.tipo}
            onChange={(e) => setForm({ ...form, tipo: e.target.value })}
          >
            {TIPOS_MOVIMENTACAO.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <label className="label">Data</label>
        <input
          type="date"
          className="input"
          required
          value={form.data}
          onChange={(e) => setForm({ ...form, data: e.target.value })}
        />
      </div>
      <div>
        <label className="label">Observações</label>
        <textarea
          className="input"
          rows={2}
          value={form.observacoes}
          onChange={(e) => setForm({ ...form, observacoes: e.target.value })}
        />
      </div>

      {erro && <p className="text-sm text-brand-red">{erro}</p>}

      <div className="flex items-center justify-between pt-2">
        <div className="flex gap-2">
          <button type="submit" disabled={salvando} className="btn-primary">
            {salvando ? "Salvando..." : "Salvar"}
          </button>
          <a href="/movimentacoes" className="btn-secondary">
            Cancelar
          </a>
        </div>
        {movimentacao && (
          <button type="button" onClick={excluir} className="btn-danger">
            Excluir
          </button>
        )}
      </div>
    </form>
  );
}
