import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { appendRow, getRows } from "@/lib/db";
import { FORMAS_PAGAMENTO } from "@/lib/types";
import type { Produto } from "@/lib/types";

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== "loja" || !session.lojaId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { itens, forma_pagamento, observacoes } = await req.json();
    if (!Array.isArray(itens) || itens.length === 0) {
      return NextResponse.json(
        { error: "Adicione ao menos um item ao pedido." },
        { status: 400 }
      );
    }
    if (!FORMAS_PAGAMENTO.includes(forma_pagamento)) {
      return NextResponse.json(
        { error: "Forma de pagamento inválida." },
        { status: 400 }
      );
    }

    const produtos = await getRows<Produto>("produtos");
    const produtoPorId = new Map(produtos.map((p) => [p.id, p]));

    let valorTotal = 0;
    const itensValidados: {
      produto_id: string;
      quantidade: number;
      preco_unitario: number;
    }[] = [];

    for (const item of itens) {
      const produto = produtoPorId.get(item.produto_id);
      const quantidade = Number(item.quantidade);
      if (!produto || !Number.isFinite(quantidade) || quantidade <= 0) {
        return NextResponse.json(
          { error: "Item de pedido inválido." },
          { status: 400 }
        );
      }
      const preco = Number(produto.preco) || 0;
      valorTotal += preco * quantidade;
      itensValidados.push({
        produto_id: produto.id,
        quantidade,
        preco_unitario: preco,
      });
    }

    const pedidoId = await appendRow("pedidos", {
      loja_id: session.lojaId,
      forma_pagamento,
      valor_total: String(valorTotal),
      observacoes: observacoes ?? "",
    });

    for (const item of itensValidados) {
      await appendRow("pedido_itens", {
        pedido_id: pedidoId,
        produto_id: item.produto_id,
        quantidade: String(item.quantidade),
        preco_unitario: String(item.preco_unitario),
      });
    }

    return NextResponse.json({ id: pedidoId }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 }
    );
  }
}
