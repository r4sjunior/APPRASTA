import Link from "next/link";
import { getRows } from "@/lib/db";
import type { Loja, Pedido } from "@/lib/types";
import { FORMAS_PAGAMENTO_LABEL } from "@/lib/types";
import { AprovarRecusarButtons } from "@/components/AprovarRecusarButtons";

export const dynamic = "force-dynamic";

function formatarMoeda(valor: string) {
  return Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export default async function PedidosAdminPage() {
  const [pedidos, lojas] = await Promise.all([
    getRows<Pedido>("pedidos"),
    getRows<Loja>("lojas"),
  ]);
  const lojaPorId = new Map(lojas.map((l) => [l.id, l]));
  const ordenados = [...pedidos].sort((a, b) =>
    a.created_at < b.created_at ? 1 : -1
  );

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-bold">Pedidos</h1>
      <div className="card divide-y divide-neutral-100">
        {ordenados.map((p) => (
          <div
            key={p.id}
            className="flex flex-wrap items-center justify-between gap-3 p-4"
          >
            <div className="min-w-0">
              <Link
                href={`/admin/pedidos/${p.id}`}
                className="font-semibold hover:underline"
              >
                {lojaPorId.get(p.loja_id)?.nome ?? "?"}
              </Link>
              <p className="text-sm text-neutral-500">
                {FORMAS_PAGAMENTO_LABEL[
                  p.forma_pagamento as keyof typeof FORMAS_PAGAMENTO_LABEL
                ] ?? p.forma_pagamento}{" "}
                · {formatarMoeda(p.valor_total)}
              </p>
              <p className="text-xs text-neutral-400">
                {new Date(p.created_at).toLocaleString("pt-BR")}
              </p>
            </div>
            {p.status === "pendente" ? (
              <AprovarRecusarButtons
                url={`/api/admin/pedidos/${p.id}`}
                aprovarBody={{ acao: "aprovar" }}
                recusarBody={{ acao: "recusar" }}
              />
            ) : (
              <span
                className={`text-sm font-semibold ${
                  p.status === "aprovado"
                    ? "text-brand-green"
                    : "text-brand-red"
                }`}
              >
                {p.status}
              </span>
            )}
          </div>
        ))}
        {ordenados.length === 0 && (
          <p className="p-4 text-sm text-neutral-500">
            Nenhum pedido ainda.
          </p>
        )}
      </div>
    </div>
  );
}
