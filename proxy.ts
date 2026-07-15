import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken } from "@/lib/auth";

const PUBLIC_PATHS = ["/login", "/pendente"];

function isPublicPath(pathname: string): boolean {
  return (
    PUBLIC_PATHS.some((p) => pathname === p) ||
    pathname.startsWith("/api/auth/")
  );
}

export async function proxy(req: NextRequest) {
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
  let basicAuthOk = false;
  if (authHeader?.startsWith("Basic ")) {
    const [user, password] = Buffer.from(authHeader.slice(6), "base64")
      .toString()
      .split(":");
    basicAuthOk = user === appUser && password === appPassword;
  }

  if (!basicAuthOk) {
    return new NextResponse("Autenticação necessária.", {
      status: 401,
      headers: { "WWW-Authenticate": 'Basic realm="Merch Control"' },
    });
  }

  // A partir daqui o Basic Auth (camada extra do app inteiro) já passou —
  // agora checamos o login/papel de cada usuário (admin vs loja).
  const { pathname } = req.nextUrl;

  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  const session = await verifySessionToken(req.cookies.get("session")?.value);

  if (!session) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (session.role === "admin") {
    return NextResponse.next();
  }

  // session.role === "loja"
  if (session.status !== "aprovado") {
    return NextResponse.redirect(new URL("/pendente", req.url));
  }

  const lojaAllowed =
    pathname.startsWith("/loja") || pathname.startsWith("/api/loja");
  if (!lojaAllowed) {
    return NextResponse.redirect(new URL("/loja", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
