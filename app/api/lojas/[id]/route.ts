import { NextRequest, NextResponse } from "next/server";
import { getRowById, updateRowById, deleteRowById } from "@/lib/sheets";
import type { Loja } from "@/lib/types";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const loja = await getRowById<Loja>("Lojas", id);
  if (!loja) {
    return NextResponse.json({ error: "Loja não encontrada" }, { status: 404 });
  }
  return NextResponse.json(loja);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const ok = await updateRowById("Lojas", id, body);
  if (!ok) {
    return NextResponse.json({ error: "Loja não encontrada" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const ok = await deleteRowById("Lojas", id);
  if (!ok) {
    return NextResponse.json({ error: "Loja não encontrada" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
