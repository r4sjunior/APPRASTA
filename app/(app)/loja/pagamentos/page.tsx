import Link from "next/link";
import { getSession } from "@/lib/auth";
import { getRowsBy } from "@/lib/db";
import type { Pagamento, Pedido } from "@/lib/types";

export const dynamic = "force-dynamic";

function formatarMoeda(valor: string) {
  return Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export default async function LojaPagamentosPage() {
  const session = await getSession();
  const pedidos = session?.lojaId
    ? await getRowsBy<Pedido>("pedidos", "loja_id", session.lojaId)
    : [];

  const pagamentosPorPedido = await Promise.all(
    pedidos.map((p) => getRowsBy<Pagamento>("pagamentos", "pedido_id", p.id))
  );
  const linhas = pedidos
    .flatMap((pedido, i) =>
      pagamentosPorPedido[i].map((pagamento) => ({ pedido, pagamento }))
    )
    .sort((a, b) =>
      a.pagamento.vencimento < b.pagamento.vencimento ? -1 : 1
    );

  const pendentes = linhas.filter((l) => l.pagamento.status === "pendente");
  const pagos = linhas.filter((l) => l.pagamento.status === "pago");
  const totalPendente = pendentes.reduce(
    (soma, l) => soma + (Number(l.pagamento.valor) || 0),
    0
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-lg font-bold">Pendências de pagamento</h1>
        <p className="text-sm text-neutral-500">
          Total em aberto: {formatarMoeda(String(totalPendente))}
        </p>
      </div>

      <div className="card divide-y divide-neutral-100">
        {pendentes.map(({ pedido, pagamento }) => (
          <Link
            key={pagamento.id}
            href={`/loja/pedidos/${pedido.id}`}
            className="flex items-center justify-between gap-3 p-4 hover:bg-neutral-50"
          >
            <div>
              <p className="font-semibold">
                {formatarMoeda(pagamento.valor)}
              </p>
              <p className="text-sm text-neutral-500">
                vencimento: {pagamento.vencimento}
              </p>
            </div>
            <span className="text-sm font-semibold text-brand-red">
              pendente
            </span>
          </Link>
        ))}
        {pendentes.length === 0 && (
          <p className="p-4 text-sm text-neutral-500">
            Nenhuma pendência de pagamento. 🎉
          </p>
        )}
      </div>

      {pagos.length > 0 && (
        <div>
          <h2 className="mb-4 text-base font-bold">Pagamentos já feitos</h2>
          <div className="card divide-y divide-neutral-100">
            {pagos.map(({ pedido, pagamento }) => (
              <Link
                key={pagamento.id}
                href={`/loja/pedidos/${pedido.id}`}
                className="flex items-center justify-between gap-3 p-4 hover:bg-neutral-50"
              >
                <p>{formatarMoeda(pagamento.valor)}</p>
                <span className="text-sm font-semibold text-brand-green">
                  pago
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
