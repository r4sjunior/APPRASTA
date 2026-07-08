import { notFound } from "next/navigation";
import { getRowById } from "@/lib/sheets";
import type { Movimentacao } from "@/lib/types";
import { MovimentacaoForm } from "@/components/MovimentacaoForm";

export const dynamic = "force-dynamic";

export default async function EditarMovimentacaoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const movimentacao = await getRowById<Movimentacao>("Movimentacoes", id);
  if (!movimentacao) notFound();

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Editar movimentação</h1>
      <MovimentacaoForm movimentacao={movimentacao} />
    </div>
  );
}
