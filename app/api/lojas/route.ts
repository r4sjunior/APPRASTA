import { NextRequest, NextResponse } from "next/server";
import { getRows, appendRow } from "@/lib/db";
import type { Loja } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const lojas = await getRows<Loja>("lojas");
    return NextResponse.json(lojas);
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
    const id = await appendRow("lojas", body);
    return NextResponse.json({ id }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 }
    );
  }
}
