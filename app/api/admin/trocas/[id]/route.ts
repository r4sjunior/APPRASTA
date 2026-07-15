import { NextRequest, NextResponse } from "next/server";
import {
  appendRow,
  getRowById,
  updateRowById,
} from "@/lib/db";
import type { Produto, TrocaDevolucao } from "@/lib/types";

function hoje() {
  return new Date().toISOString().slice(0, 10);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { acao } = await req.json();

    const troca = await getRowById<TrocaDevolucao>("trocas_devolucoes", id);
    if (!troca) {
      return NextResponse.json(
        { error: "Solicitação não encontrada" },
        { status: 404 }
      );
    }
    if (troca.status !== "pendente") {
      return NextResponse.json(
        { error: "Esta solicitação já foi decidida" },
        { status: 400 }
      );
    }

    if (acao === "aprovar") {
      const produto = await getRowById<Produto>("produtos", troca.produto_id);
      if (!produto) {
        return NextResponse.json(
          { error: "Produto não encontrado" },
          { status: 404 }
        );
      }
      const novoEstoque =
        Number(produto.estoque_geral || 0) + Number(troca.quantidade);
      await updateRowById("produtos", produto.id, {
        estoque_geral: String(novoEstoque),
      });
      await appendRow("movimentacoes", {
        loja_id: troca.loja_id,
        produto_id: troca.produto_id,
        quantidade: troca.quantidade,
        tipo: "DEVOLUCAO",
        data: hoje(),
        observacoes: `${troca.tipo} ${id}`,
      });
      await updateRowById("trocas_devolucoes", id, {
        status: "aprovado",
        decidido_em: new Date().toISOString(),
      });
      return NextResponse.json({ ok: true });
    }

    if (acao === "recusar") {
      await updateRowById("trocas_devolucoes", id, {
        status: "recusado",
        decidido_em: new Date().toISOString(),
      });
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Ação inválida" }, { status: 400 });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 }
    );
  }
}
