import { getRows } from "@/lib/db";
import type { Loja, Produto, TrocaDevolucao } from "@/lib/types";
import { AprovarRecusarButtons } from "@/components/AprovarRecusarButtons";

export const dynamic = "force-dynamic";

export default async function TrocasAdminPage() {
  const [trocas, lojas, produtos] = await Promise.all([
    getRows<TrocaDevolucao>("trocas_devolucoes"),
    getRows<Loja>("lojas"),
    getRows<Produto>("produtos"),
  ]);
  const lojaPorId = new Map(lojas.map((l) => [l.id, l]));
  const produtoPorId = new Map(produtos.map((p) => [p.id, p]));
  const ordenadas = [...trocas].sort((a, b) =>
    a.created_at < b.created_at ? 1 : -1
  );

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-bold">Trocas e devoluções</h1>
      <div className="card divide-y divide-neutral-100">
        {ordenadas.map((t) => (
          <div
            key={t.id}
            className="flex flex-wrap items-center justify-between gap-3 p-4"
          >
            <div className="min-w-0">
              <p className="font-semibold">
                {lojaPorId.get(t.loja_id)?.nome ?? "?"} · {t.tipo}
              </p>
              <p className="text-sm text-neutral-500">
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
            {t.status === "pendente" ? (
              <AprovarRecusarButtons
                url={`/api/admin/trocas/${t.id}`}
                aprovarBody={{ acao: "aprovar" }}
                recusarBody={{ acao: "recusar" }}
              />
            ) : (
              <span
                className={`text-sm font-semibold ${
                  t.status === "aprovado"
                    ? "text-brand-green"
                    : "text-brand-red"
                }`}
              >
                {t.status}
              </span>
            )}
          </div>
        ))}
        {ordenadas.length === 0 && (
          <p className="p-4 text-sm text-neutral-500">
            Nenhuma solicitação de troca/devolução ainda.
          </p>
        )}
      </div>
    </div>
  );
}
