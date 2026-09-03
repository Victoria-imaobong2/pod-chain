import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

function extractRoleFromToken(token: string): string {
  try {
    if (!token.includes(".")) return "SME";
    const payload = JSON.parse(Buffer.from(token.split(".")[1], "base64").toString());
    return String(payload.role || "SME").toUpperCase();
  } catch {
    return "SME";
  }
}

export function middleware(request: NextRequest) {
  const token = request.cookies.get("token")?.value;
  const { pathname } = request.nextUrl;

  const protectedRoutes = ["/dashboard", "/create-parcel", "/courier", "/receiver"];
  const isProtected = protectedRoutes.some((route) => pathname.startsWith(route));

  // 1. Unauthenticated users trying to access protected paths -> /login
  if (isProtected && !token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 2. Already logged-in users visiting /login or /signup -> redirect to their active portal
  if ((pathname === "/login" || pathname === "/signup") && token) {
    const role = extractRoleFromToken(token);
    let target = "/dashboard";
    if (role === "RECEIVER") target = "/receiver";
    if (role === "COURIER") target = "/courier";

    return NextResponse.redirect(new URL(target, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/create-parcel/:path*",
    "/courier/:path*",
    "/receiver/:path*",
    "/login",
    "/signup",
  ],
};