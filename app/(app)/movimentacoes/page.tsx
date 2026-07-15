"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Movimentacao, Produto, Loja } from "@/lib/types";

export default function MovimentacoesPage() {
  const [movs, setMovs] = useState<Movimentacao[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [lojas, setLojas] = useState<Loja[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/movimentacoes").then((r) => r.json()),
      fetch("/api/produtos").then((r) => r.json()),
      fetch("/api/lojas").then((r) => r.json()),
    ])
      .then(([m, p, l]) => {
        if (m.error) throw new Error(m.error);
        setMovs(m);
        setProdutos(p);
        setLojas(l);
      })
      .catch((e) => setErro(String(e.message ?? e)))
      .finally(() => setLoading(false));
  }, []);

  const nomeLoja = (id: string) => lojas.find((l) => l.id === id)?.nome ?? id;
  const nomeProduto = (id: string) => produtos.find((p) => p.id === id)?.nome ?? id;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-xl font-bold">Movimentação</h1>
        <Link href="/movimentacoes/novo" className="btn-primary whitespace-nowrap">
          + Add
        </Link>
      </div>

      {erro && <p className="text-sm text-brand-red">{erro}</p>}
      {loading && <p className="text-sm text-neutral-500">Carregando...</p>}

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-200 bg-neutral-50 text-left text-neutral-500">
              <th className="px-4 py-2 font-medium">Loja</th>
              <th className="px-4 py-2 font-medium">Produto</th>
              <th className="px-4 py-2 font-medium">Quantidade</th>
              <th className="px-4 py-2 font-medium">Tipo</th>
              <th className="px-4 py-2 font-medium">Data</th>
              <th className="px-4 py-2 font-medium">Observações</th>
            </tr>
          </thead>
          <tbody>
            {movs.map((m) => (
              <tr key={m.id} className="border-b border-neutral-100 last:border-0">
                <td className="px-4 py-2">
                  <Link href={`/movimentacoes/${m.id}`} className="hover:underline">
                    {nomeLoja(m.loja_id)}
                  </Link>
                </td>
                <td className="px-4 py-2">{nomeProduto(m.produto_id)}</td>
                <td className="px-4 py-2">{m.quantidade}</td>
                <td className="px-4 py-2">{m.tipo}</td>
                <td className="px-4 py-2">{m.data}</td>
                <td className="px-4 py-2">{m.observacoes}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && movs.length === 0 && (
          <p className="p-4 text-sm text-neutral-500">Nenhuma movimentação registrada.</p>
        )}
      </div>
    </div>
  );
}
