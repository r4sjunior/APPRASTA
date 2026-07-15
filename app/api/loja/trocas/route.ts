import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { appendRow } from "@/lib/db";
import { TIPOS_TROCA } from "@/lib/types";

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== "loja" || !session.lojaId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { produto_id, pedido_id, quantidade, tipo, motivo } =
      await req.json();

    if (!produto_id) {
      return NextResponse.json(
        { error: "Selecione um produto." },
        { status: 400 }
      );
    }
    if (!TIPOS_TROCA.includes(tipo)) {
      return NextResponse.json({ error: "Tipo inválido." }, { status: 400 });
    }
    const qtd = Number(quantidade);
    if (!Number.isFinite(qtd) || qtd <= 0) {
      return NextResponse.json(
        { error: "Quantidade inválida." },
        { status: 400 }
      );
    }

    const data: Record<string, string> = {
      loja_id: session.lojaId,
      produto_id,
      quantidade: String(qtd),
      tipo,
      motivo: motivo ?? "",
    };
    if (pedido_id) data.pedido_id = pedido_id;

    const id = await appendRow("trocas_devolucoes", data);
    return NextResponse.json({ id }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 }
    );
  }
}
