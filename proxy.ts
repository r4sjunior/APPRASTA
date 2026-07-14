import { NextRequest, NextResponse } from "next/server";

export function proxy(req: NextRequest) {
  const appUser = process.env.APP_USER || "admin";
  const appPassword = process.env.APP_PASSWORD;

  if (!appPassword) {
    return NextResponse.json(
      {
        error:
          "APP_PASSWORD não configurada. Defina a variável de ambiente APP_PASSWORD para liberar o acesso ao app (veja o .env.example).",
      },
      { status: 500 }
    );
  }

  const authHeader = req.headers.get("authorization");
  if (authHeader?.startsWith("Basic ")) {
    const [user, password] = Buffer.from(authHeader.slice(6), "base64")
      .toString()
      .split(":");
    if (user === appUser && password === appPassword) {
      return NextResponse.next();
    }
  }

  return new NextResponse("Autenticação necessária.", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="Merch Control"' },
  });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
