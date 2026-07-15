import { getSession } from "@/lib/auth";
import { getRows, getRowsBy } from "@/lib/db";
import type { Pedido, Produto, TrocaDevolucao } from "@/lib/types";
import { TrocaForm } from "@/components/TrocaForm";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = {
  pendente: "Aguardando análise",
  aprovado: "Aprovado",
  recusado: "Recusado",
};

export default async function LojaTrocasPage() {
  const session = await getSession();
  const lojaId = session?.lojaId ?? "";

  const [produtos, pedidos, trocas] = await Promise.all([
    getRows<Produto>("produtos"),
    lojaId ? getRowsBy<Pedido>("pedidos", "loja_id", lojaId) : Promise.resolve([]),
    lojaId
      ? getRowsBy<TrocaDevolucao>("trocas_devolucoes", "loja_id", lojaId)
      : Promise.resolve([]),
  ]);
  const produtoPorId = new Map(produtos.map((p) => [p.id, p]));
  const ordenadas = [...trocas].sort((a, b) =>
    a.created_at < b.created_at ? 1 : -1
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="mb-4 text-lg font-bold">Solicitar troca/devolução</h1>
        <TrocaForm produtos={produtos} pedidos={pedidos} />
      </div>

      <div>
        <h2 className="mb-4 text-base font-bold">Minhas solicitações</h2>
        <div className="card divide-y divide-neutral-100">
          {ordenadas.map((t) => (
            <div key={t.id} className="flex items-center justify-between gap-3 p-4">
              <div>
                <p className="font-semibold">
                  {t.tipo === "TROCA" ? "Troca" : "Devolução"} ·{" "}
                  {produtoPorId.get(t.produto_id)?.nome ?? "?"} ×{" "}
                  {t.quantidade}
                </p>
                {t.motivo && (
                  <p className="text-sm text-neutral-500">{t.motivo}</p>
                )}
                <p className="text-xs text-neutral-400">
                  {new Date(t.created_at).toLocaleString("pt-BR")}
                </p>
              </div>
              <span
                className={`text-sm font-semibold ${
                  t.status === "aprovado"
                    ? "text-brand-green"
                    : t.status === "recusado"
                    ? "text-brand-red"
                    : "text-neutral-500"
                }`}
              >
                {STATUS_LABEL[t.status] ?? t.status}
              </span>
            </div>
          ))}
          {ordenadas.length === 0 && (
            <p className="p-4 text-sm text-neutral-500">
              Nenhuma solicitação ainda.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
