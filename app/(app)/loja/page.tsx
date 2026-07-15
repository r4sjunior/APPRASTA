import Link from "next/link";
import { getRows } from "@/lib/db";
import type { Produto } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function LojaEstoquePage() {
  const produtos = await getRows<Produto>("produtos");

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-lg font-bold">Estoque disponível</h1>
        <Link href="/loja/pedidos/novo" className="btn-primary">
          + Novo pedido
        </Link>
      </div>

      <div className="card divide-y divide-neutral-100">
        {produtos.map((p) => (
          <div key={p.id} className="flex items-center gap-4 p-3">
            <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded bg-neutral-100">
              {p.imagem_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={p.imagem_url}
                  alt={p.nome}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-lg">
                  📦
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold">{p.nome}</p>
              <p className="truncate text-sm text-neutral-500">
                {p.descricao || p.categoria}
              </p>
            </div>
            <div className="flex-shrink-0 text-right text-sm">
              <p className="font-semibold">
                {Number(p.preco || 0).toLocaleString("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                })}
              </p>
              <p className="text-neutral-500">
                disponível: {p.estoque_geral || 0}
              </p>
            </div>
          </div>
        ))}
        {produtos.length === 0 && (
          <p className="p-4 text-sm text-neutral-500">
            Nenhum produto cadastrado ainda.
          </p>
        )}
      </div>
    </div>
  );
}
