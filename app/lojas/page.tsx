"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { Loja } from "@/lib/types";

export default function LojasPage() {
  const [lojas, setLojas] = useState<Loja[]>([]);
  const [busca, setBusca] = useState("");
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/lojas")
      .then((r) => r.json())
      .then((data) => {
        if (data.error) setErro(data.error);
        else setLojas(data);
      })
      .catch((e) => setErro(String(e)))
      .finally(() => setLoading(false));
  }, []);

  const filtradas = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return lojas;
    return lojas.filter(
      (l) =>
        l.nome.toLowerCase().includes(termo) ||
        l.cidade.toLowerCase().includes(termo)
    );
  }, [lojas, busca]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <input
          className="input max-w-sm"
          placeholder="Buscar loja..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />
        <Link href="/lojas/novo" className="btn-primary whitespace-nowrap">
          + Nova loja
        </Link>
      </div>

      {erro && <p className="text-sm text-brand-red">{erro}</p>}
      {loading && <p className="text-sm text-neutral-500">Carregando...</p>}

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-200 bg-neutral-50 text-left text-neutral-500">
              <th className="px-4 py-2 font-medium">Loja</th>
              <th className="px-4 py-2 font-medium">Cidade</th>
              <th className="px-4 py-2 font-medium">Telefone</th>
              <th className="px-4 py-2 font-medium">Endereço</th>
            </tr>
          </thead>
          <tbody>
            {filtradas.map((l) => (
              <tr key={l.id} className="border-b border-neutral-100 last:border-0">
                <td className="px-4 py-2">
                  <Link href={`/lojas/${l.id}`} className="font-medium hover:underline">
                    {l.nome}
                  </Link>
                </td>
                <td className="px-4 py-2">{l.cidade}</td>
                <td className="px-4 py-2">{l.telefone}</td>
                <td className="px-4 py-2">{l.endereco}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && filtradas.length === 0 && (
          <p className="p-4 text-sm text-neutral-500">Nenhuma loja encontrada.</p>
        )}
      </div>
    </div>
  );
}
