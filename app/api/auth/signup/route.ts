import { NextRequest, NextResponse } from "next/server";
import { signup, redirectPathFor } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const profile = await signup({
      email: body.email ?? "",
      senha: body.senha ?? "",
      nome: body.nome ?? "",
      cidade: body.cidade ?? "",
      telefone: body.telefone ?? "",
      endereco: body.endereco ?? "",
    });
    return NextResponse.json({ redirectTo: redirectPathFor(profile) });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 400 }
    );
  }
}
