import { NextRequest, NextResponse } from "next/server";
import { login, redirectPathFor } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { identifier, senha } = await req.json();
    if (!identifier || !senha) {
      return NextResponse.json(
        { error: "Informe usuário/e-mail e senha." },
        { status: 400 }
      );
    }
    const profile = await login(identifier, senha);
    return NextResponse.json({ redirectTo: redirectPathFor(profile) });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 401 }
    );
  }
}
