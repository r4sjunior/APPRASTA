import { notFound } from "next/navigation";
import { getRowById, getRows, getRowsBy } from "@/lib/db";
import type {
  Loja,
  Pagamento,
  Pedido,
  PedidoItem,
  Produto,
} from "@/lib/types";
import { FORMAS_PAGAMENTO_LABEL } from "@/lib/types";
import { AprovarRecusarButtons } from "@/components/AprovarRecusarButtons";
import { MarcarPagoButton } from "@/components/MarcarPagoButton";

export const dynamic = "force-dynamic";

function formatarMoeda(valor: string) {
  return Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export default async function PedidoAdminDetalhePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const pedido = await getRowById<Pedido>("pedidos", id);
  if (!pedido) notFound();

  const [loja, itens, pagamentos, produtos] = await Promise.all([
    getRowById<Loja>("lojas", pedido.loja_id),
    getRowsBy<PedidoItem>("pedido_itens", "pedido_id", id),
    getRowsBy<Pagamento>("pagamentos", "pedido_id", id),
    getRows<Produto>("produtos"),
  ]);
  const produtoPorId = new Map(produtos.map((p) => [p.id, p]));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold">Pedido de {loja?.nome ?? "?"}</h1>
          <p className="text-sm text-neutral-500">
            {FORMAS_PAGAMENTO_LABEL[
              pedido.forma_pagamento as keyof typeof FORMAS_PAGAMENTO_LABEL
            ] ?? pedido.forma_pagamento}{" "}
            · {formatarMoeda(pedido.valor_total)} ·{" "}
            {new Date(pedido.created_at).toLocaleString("pt-BR")}
          </p>
        </div>
        {pedido.status === "pendente" ? (
          <AprovarRecusarButtons
            url={`/api/admin/pedidos/${pedido.id}`}
            aprovarBody={{ acao: "aprovar" }}
            recusarBody={{ acao: "recusar" }}
          />
        ) : (
          <span
            className={`text-sm font-semibold ${
              pedido.status === "aprovado"
                ? "text-brand-green"
                : "text-brand-red"
            }`}
          >
            {pedido.status}
          </span>
        )}
      </div>

      {pedido.observacoes && (
        <p className="card p-4 text-sm text-neutral-600">
          {pedido.observacoes}
        </p>
      )}

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
            As parcelas são geradas quando o pedido é aprovado.
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
            {pag.status === "pago" ? (
              <span className="text-sm font-semibold text-brand-green">
                pago
              </span>
            ) : (
              <MarcarPagoButton pagamentoId={pag.id} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
