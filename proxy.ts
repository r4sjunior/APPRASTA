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
