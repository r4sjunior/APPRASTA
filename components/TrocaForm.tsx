"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Pedido, Produto, TipoTroca } from "@/lib/types";
import { TIPOS_TROCA } from "@/lib/types";

export function TrocaForm({
  produtos,
  pedidos,
}: {
  produtos: Produto[];
  pedidos: Pedido[];
}) {
  const router = useRouter();
  const [produtoId, setProdutoId] = useState("");
  const [pedidoId, setPedidoId] = useState("");
  const [quantidade, setQuantidade] = useState("1");
  const [tipo, setTipo] = useState<TipoTroca>(TIPOS_TROCA[0]);
  const [motivo, setMotivo] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setEnviando(true);
    try {
      const res = await fetch("/api/loja/trocas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          produto_id: produtoId,
          pedido_id: pedidoId || undefined,
          quantidade: Number(quantidade),
          tipo,
          motivo,
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setProdutoId("");
      setPedidoId("");
      setQuantidade("1");
      setMotivo("");
      router.refresh();
    } catch (err) {
      setErro((err as Error).message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={enviar} className="card space-y-4 p-6">
      <div>
        <label className="label">Tipo</label>
        <select
          className="input"
          value={tipo}
          onChange={(e) => setTipo(e.target.value as TipoTroca)}
        >
          {TIPOS_TROCA.map((t) => (
            <option key={t} value={t}>
              {t === "TROCA" ? "Troca" : "Devolução"}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="label">Produto</label>
        <select
          className="input"
          required
          value={produtoId}
          onChange={(e) => setProdutoId(e.target.value)}
        >
          <option value="">Selecione...</option>
          {produtos.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nome}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="label">Pedido relacionado (opcional)</label>
        <select
          className="input"
          value={pedidoId}
          onChange={(e) => setPedidoId(e.target.value)}
        >
          <option value="">Nenhum</option>
          {pedidos.map((p) => (
            <option key={p.id} value={p.id}>
              Pedido de {new Date(p.created_at).toLocaleDateString("pt-BR")}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="label">Quantidade</label>
        <input
          type="number"
          min={1}
          className="input"
          required
          value={quantidade}
          onChange={(e) => setQuantidade(e.target.value)}
        />
      </div>
      <div>
        <label className="label">Motivo</label>
        <textarea
          className="input"
          rows={2}
          value={motivo}
          onChange={(e) => setMotivo(e.target.value)}
        />
      </div>

      {erro && <p className="text-sm text-brand-red">{erro}</p>}

      <button type="submit" disabled={enviando} className="btn-primary">
        {enviando ? "Enviando..." : "Solicitar"}
      </button>
    </form>
  );
}
