import { jwtVerify } from "jose";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getJwtSecretKey } from "@/lib/auth/secret";

const PROTECTED_PREFIXES = [
  "/dashboard",
  "/pos",
  "/inventory",
  "/reports",
  "/settings",
] as const;

const MANAGER_PREFIXES = ["/inventory", "/reports", "/settings"] as const;

function matchesPath(pathname: string, prefix: string) {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("nostic_session")?.value;

  if (pathname === "/login" || pathname === "/forgot-password") {
    if (token) {
      try {
        await jwtVerify(token, getJwtSecretKey());
        return NextResponse.redirect(new URL("/dashboard", request.url));
      } catch {
        /* show login */
      }
    }
    return NextResponse.next();
  }

  if (pathname === "/") {
    if (!token) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    try {
      await jwtVerify(token, getJwtSecretKey());
      return NextResponse.redirect(new URL("/dashboard", request.url));
    } catch {
      const res = NextResponse.redirect(new URL("/login", request.url));
      res.cookies.delete("nostic_session");
      return res;
    }
  }

  const needsAuth = PROTECTED_PREFIXES.some((p) => matchesPath(pathname, p));
  if (!needsAuth) {
    return NextResponse.next();
  }

  if (!token) {
    const login = new URL("/login", request.url);
    login.searchParams.set("from", pathname);
    return NextResponse.redirect(login);
  }

  let role: string | undefined;
  try {
    const { payload } = await jwtVerify(token, getJwtSecretKey());
    role = payload.role as string | undefined;
  } catch {
    const login = new URL("/login", request.url);
    const res = NextResponse.redirect(login);
    res.cookies.delete("nostic_session");
    return res;
  }

  const isManagerOnly = MANAGER_PREFIXES.some((p) => matchesPath(pathname, p));
  if (isManagerOnly && role !== "manager") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/login",
    "/forgot-password",
    "/dashboard",
    "/dashboard/:path*",
    "/pos",
    "/pos/:path*",
    "/inventory",
    "/inventory/:path*",
    "/reports",
    "/reports/:path*",
    "/settings",
    "/settings/:path*",
  ],
};
