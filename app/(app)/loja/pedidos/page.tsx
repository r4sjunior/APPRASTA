import Link from "next/link";
import { getSession } from "@/lib/auth";
import { getRowsBy } from "@/lib/db";
import type { Pedido } from "@/lib/types";
import { FORMAS_PAGAMENTO_LABEL } from "@/lib/types";

export const dynamic = "force-dynamic";

function formatarMoeda(valor: string) {
  return Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

const STATUS_LABEL: Record<string, string> = {
  pendente: "Aguardando aprovação",
  aprovado: "Aprovado",
  recusado: "Recusado",
};

export default async function LojaPedidosPage() {
  const session = await getSession();
  const pedidos = session?.lojaId
    ? await getRowsBy<Pedido>("pedidos", "loja_id", session.lojaId)
    : [];
  const ordenados = [...pedidos].sort((a, b) =>
    a.created_at < b.created_at ? 1 : -1
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-lg font-bold">Meus pedidos</h1>
        <Link href="/loja/pedidos/novo" className="btn-primary">
          + Novo pedido
        </Link>
      </div>

      <div className="card divide-y divide-neutral-100">
        {ordenados.map((p) => (
          <Link
            key={p.id}
            href={`/loja/pedidos/${p.id}`}
            className="flex flex-wrap items-center justify-between gap-3 p-4 hover:bg-neutral-50"
          >
            <div>
              <p className="font-semibold">{formatarMoeda(p.valor_total)}</p>
              <p className="text-sm text-neutral-500">
                {FORMAS_PAGAMENTO_LABEL[
                  p.forma_pagamento as keyof typeof FORMAS_PAGAMENTO_LABEL
                ] ?? p.forma_pagamento}
              </p>
              <p className="text-xs text-neutral-400">
                {new Date(p.created_at).toLocaleString("pt-BR")}
              </p>
            </div>
            <span
              className={`text-sm font-semibold ${
                p.status === "aprovado"
                  ? "text-brand-green"
                  : p.status === "recusado"
                  ? "text-brand-red"
                  : "text-neutral-500"
              }`}
            >
              {STATUS_LABEL[p.status] ?? p.status}
            </span>
          </Link>
        ))}
        {ordenados.length === 0 && (
          <p className="p-4 text-sm text-neutral-500">
            Você ainda não fez nenhum pedido.
          </p>
        )}
      </div>
    </div>
  );
}
