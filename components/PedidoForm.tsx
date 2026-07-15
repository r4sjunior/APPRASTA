"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { FormaPagamento, Produto } from "@/lib/types";
import { FORMAS_PAGAMENTO, FORMAS_PAGAMENTO_LABEL } from "@/lib/types";

function formatarMoeda(valor: number) {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function PedidoForm({ produtos }: { produtos: Produto[] }) {
  const router = useRouter();
  const [quantidades, setQuantidades] = useState<Record<string, string>>({});
  const [formaPagamento, setFormaPagamento] = useState<FormaPagamento>(
    FORMAS_PAGAMENTO[0]
  );
  const [observacoes, setObservacoes] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const itensSelecionados = produtos
    .map((p) => ({ produto: p, quantidade: Number(quantidades[p.id] || 0) }))
    .filter((i) => i.quantidade > 0);

  const total = itensSelecionados.reduce(
    (soma, i) => soma + i.quantidade * (Number(i.produto.preco) || 0),
    0
  );

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    if (itensSelecionados.length === 0) {
      setErro("Selecione a quantidade de ao menos um produto.");
      return;
    }
    setEnviando(true);
    try {
      const res = await fetch("/api/loja/pedidos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itens: itensSelecionados.map((i) => ({
            produto_id: i.produto.id,
            quantidade: i.quantidade,
          })),
          forma_pagamento: formaPagamento,
          observacoes,
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      router.push("/loja/pedidos");
      router.refresh();
    } catch (err) {
      setErro((err as Error).message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={enviar} className="space-y-6">
      <div className="card divide-y divide-neutral-100">
        {produtos.map((p) => (
          <div
            key={p.id}
            className="flex items-center justify-between gap-4 p-4"
          >
            <div className="min-w-0">
              <p className="font-semibold">{p.nome}</p>
              <p className="text-sm text-neutral-500">
                {formatarMoeda(Number(p.preco) || 0)} · disponível:{" "}
                {p.estoque_geral || 0}
              </p>
            </div>
            <input
              type="number"
              min={0}
              max={Number(p.estoque_geral) || 0}
              className="input w-24"
              value={quantidades[p.id] ?? ""}
              onChange={(e) =>
                setQuantidades({ ...quantidades, [p.id]: e.target.value })
              }
            />
          </div>
        ))}
        {produtos.length === 0 && (
          <p className="p-4 text-sm text-neutral-500">
            Nenhum produto disponível no momento.
          </p>
        )}
      </div>

      <div>
        <label className="label">Forma de pagamento</label>
        <select
          className="input"
          value={formaPagamento}
          onChange={(e) =>
            setFormaPagamento(e.target.value as FormaPagamento)
          }
        >
          {FORMAS_PAGAMENTO.map((f) => (
            <option key={f} value={f}>
              {FORMAS_PAGAMENTO_LABEL[f]}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="label">Observações</label>
        <textarea
          className="input"
          rows={2}
          value={observacoes}
          onChange={(e) => setObservacoes(e.target.value)}
        />
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-neutral-500">
          Total:{" "}
          <span className="font-semibold text-neutral-900">
            {formatarMoeda(total)}
          </span>
        </p>
        <button type="submit" disabled={enviando} className="btn-primary">
          {enviando ? "Enviando..." : "Enviar pedido"}
        </button>
      </div>

      {erro && <p className="text-sm text-brand-red">{erro}</p>}
    </form>
  );
}
