import { NextRequest, NextResponse } from "next/server";
import { getRowById, updateRowById, deleteRowById } from "@/lib/sheets";
import type { Movimentacao } from "@/lib/types";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const mov = await getRowById<Movimentacao>("Movimentacoes", id);
  if (!mov) {
    return NextResponse.json({ error: "Movimentação não encontrada" }, { status: 404 });
  }
  return NextResponse.json(mov);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const ok = await updateRowById("Movimentacoes", id, body);
  if (!ok) {
    return NextResponse.json({ error: "Movimentação não encontrada" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const ok = await deleteRowById("Movimentacoes", id);
  if (!ok) {
    return NextResponse.json({ error: "Movimentação não encontrada" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
