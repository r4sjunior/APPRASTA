"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { Produto } from "@/lib/types";

export default function ProdutosPage() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [busca, setBusca] = useState("");
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/produtos")
      .then((r) => r.json())
      .then((data) => {
        if (data.error) setErro(data.error);
        else setProdutos(data);
      })
      .catch((e) => setErro(String(e)))
      .finally(() => setLoading(false));
  }, []);

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return produtos;
    return produtos.filter(
      (p) =>
        p.nome.toLowerCase().includes(termo) ||
        p.descricao.toLowerCase().includes(termo) ||
        p.categoria?.toLowerCase().includes(termo)
    );
  }, [produtos, busca]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <input
          className="input max-w-sm"
          placeholder="Buscar produto..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />
        <Link href="/produtos/novo" className="btn-primary whitespace-nowrap">
          + Novo produto
        </Link>
      </div>

      {erro && <p className="text-sm text-brand-red">{erro}</p>}
      {loading && <p className="text-sm text-neutral-500">Carregando...</p>}

      <div className="card divide-y divide-neutral-100">
        {filtrados.map((p) => (
          <Link
            key={p.id}
            href={`/produtos/${p.id}`}
            className="flex items-center gap-4 p-3 hover:bg-neutral-50"
          >
            <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded bg-neutral-100">
              {p.imagem_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={p.imagem_url}
                  alt={p.nome}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-lg">
                  📦
                </div>
              )}
            </div>
            <div className="min-w-0">
              <p className="truncate font-semibold">{p.nome}</p>
              <p className="truncate text-sm text-neutral-500">
                {p.descricao || p.categoria}
              </p>
            </div>
          </Link>
        ))}
        {!loading && filtrados.length === 0 && (
          <p className="p-4 text-sm text-neutral-500">Nenhum produto encontrado.</p>
        )}
      </div>
    </div>
  );
}
