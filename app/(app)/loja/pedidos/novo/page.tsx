import { getRows } from "@/lib/db";
import type { Produto } from "@/lib/types";
import { PedidoForm } from "@/components/PedidoForm";

export const dynamic = "force-dynamic";

export default async function NovoPedidoPage() {
  const produtos = await getRows<Produto>("produtos");
  const disponiveis = produtos.filter((p) => Number(p.estoque_geral) > 0);

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-bold">Novo pedido</h1>
      <PedidoForm produtos={disponiveis} />
    </div>
  );
}
