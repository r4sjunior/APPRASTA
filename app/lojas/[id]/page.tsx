import { notFound } from "next/navigation";
import { getRowById } from "@/lib/sheets";
import type { Loja } from "@/lib/types";
import { LojaForm } from "@/components/LojaForm";

export const dynamic = "force-dynamic";

export default async function EditarLojaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const loja = await getRowById<Loja>("Lojas", id);
  if (!loja) notFound();

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Editar loja</h1>
      <LojaForm loja={loja} />
    </div>
  );
}
