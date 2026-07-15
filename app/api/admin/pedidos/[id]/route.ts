import { NextRequest, NextResponse } from "next/server";
import { getClient, updateRowById } from "@/lib/db";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { acao } = await req.json();

    if (acao === "aprovar") {
      // Sem tipos gerados do schema do Supabase, `.rpc` infere os parâmetros
      // como `never` — o `any` aqui contorna isso (mesmo padrão de lib/db.ts).
      const { error } = await (getClient().rpc as any)("aprovar_pedido", {
        p_pedido_id: id,
      });
      if (error) throw new Error((error as { message: string }).message);
      return NextResponse.json({ ok: true });
    }

    if (acao === "recusar") {
      const ok = await updateRowById("pedidos", id, {
        status: "recusado",
        decidido_em: new Date().toISOString(),
      });
      if (!ok) {
        return NextResponse.json(
          { error: "Pedido não encontrado" },
          { status: 404 }
        );
      }
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
