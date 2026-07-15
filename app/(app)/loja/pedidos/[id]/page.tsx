import { notFound } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getRowById, getRows, getRowsBy } from "@/lib/db";
import type { Pagamento, Pedido, PedidoItem, Produto } from "@/lib/types";
import { FORMAS_PAGAMENTO_LABEL } from "@/lib/types";

export const dynamic = "force-dynamic";

function formatarMoeda(valor: string) {
  return Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export default async function LojaPedidoDetalhePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getSession();
  const pedido = await getRowById<Pedido>("pedidos", id);
  if (!pedido || pedido.loja_id !== session?.lojaId) notFound();

  const [itens, pagamentos, produtos] = await Promise.all([
    getRowsBy<PedidoItem>("pedido_itens", "pedido_id", id),
    getRowsBy<Pagamento>("pagamentos", "pedido_id", id),
    getRows<Produto>("produtos"),
  ]);
  const produtoPorId = new Map(produtos.map((p) => [p.id, p]));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-bold">Pedido</h1>
        <p className="text-sm text-neutral-500">
          {FORMAS_PAGAMENTO_LABEL[
            pedido.forma_pagamento as keyof typeof FORMAS_PAGAMENTO_LABEL
          ] ?? pedido.forma_pagamento}{" "}
          · {formatarMoeda(pedido.valor_total)} ·{" "}
          {new Date(pedido.created_at).toLocaleString("pt-BR")}
        </p>
        <p
          className={`mt-1 text-sm font-semibold ${
            pedido.status === "aprovado"
              ? "text-brand-green"
              : pedido.status === "recusado"
              ? "text-brand-red"
              : "text-neutral-500"
          }`}
        >
          {pedido.status === "pendente"
            ? "Aguardando aprovação"
            : pedido.status}
        </p>
      </div>

      <div className="card divide-y divide-neutral-100">
        <p className="p-4 pb-2 text-sm font-semibold text-neutral-500">
          Itens
        </p>
        {itens.map((item) => (
          <div key={item.id} className="flex justify-between p-4 pt-2">
            <span>{produtoPorId.get(item.produto_id)?.nome ?? "?"}</span>
            <span className="text-neutral-500">
              {item.quantidade} × {formatarMoeda(item.preco_unitario)}
            </span>
          </div>
        ))}
      </div>

      <div className="card divide-y divide-neutral-100">
        <p className="p-4 pb-2 text-sm font-semibold text-neutral-500">
          Parcelas
        </p>
        {pagamentos.length === 0 && (
          <p className="p-4 pt-2 text-sm text-neutral-500">
            As parcelas aparecem aqui assim que o pedido for aprovado.
          </p>
        )}
        {pagamentos.map((pag) => (
          <div
            key={pag.id}
            className="flex items-center justify-between p-4 pt-2"
          >
            <div>
              <p>{formatarMoeda(pag.valor)}</p>
              <p className="text-xs text-neutral-500">
                vencimento: {pag.vencimento}
              </p>
            </div>
            <span
              className={`text-sm font-semibold ${
                pag.status === "pago" ? "text-brand-green" : "text-neutral-500"
              }`}
            >
              {pag.status === "pago" ? "pago" : "pendente"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
