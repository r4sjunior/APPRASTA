import { NextRequest, NextResponse } from "next/server";
import { updateRowById } from "@/lib/db";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { status } = await req.json();
    if (status !== "aprovado" && status !== "recusado") {
      return NextResponse.json({ error: "Status inválido" }, { status: 400 });
    }
    const ok = await updateRowById("profiles", id, { status });
    if (!ok) {
      return NextResponse.json(
        { error: "Cadastro não encontrado" },
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
