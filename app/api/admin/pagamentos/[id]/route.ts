import { NextRequest, NextResponse } from "next/server";
import { updateRowById } from "@/lib/db";

export async function PATCH(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const ok = await updateRowById("pagamentos", id, {
      status: "pago",
      pago_em: new Date().toISOString(),
    });
    if (!ok) {
      return NextResponse.json(
        { error: "Parcela não encontrada" },
        { status: 404 }
      );
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 }
    );
  }
}
