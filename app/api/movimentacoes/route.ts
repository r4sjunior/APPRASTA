import { NextRequest, NextResponse } from "next/server";
import { getRows, appendRow } from "@/lib/db";
import type { Movimentacao } from "@/lib/types";

export async function GET() {
  try {
    const movimentacoes = await getRows<Movimentacao>("movimentacoes");
    movimentacoes.sort((a, b) => (a.data < b.data ? 1 : -1));
    return NextResponse.json(movimentacoes);
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const id = await appendRow("movimentacoes", body);
    return NextResponse.json({ id }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 }
    );
  }
}
