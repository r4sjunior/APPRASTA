import { notFound } from "next/navigation";
import { getRowById } from "@/lib/db";
import type { Produto } from "@/lib/types";
import { ProdutoForm } from "@/components/ProdutoForm";

export const dynamic = "force-dynamic";

export default async function EditarProdutoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const produto = await getRowById<Produto>("produtos", id);
  if (!produto) notFound();

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Editar produto</h1>
      <ProdutoForm produto={produto} />
    </div>
  );
}
