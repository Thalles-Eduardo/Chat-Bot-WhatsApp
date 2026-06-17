import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";
import {
  ACCESS_TOKEN_COOKIE,
  PUBLIC_ROUTES,
  AUTH_API_PREFIX,
  WEBHOOKS_API_PREFIX,
} from "@/lib/auth/constants";

function getAccessSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is not set");
  return new TextEncoder().encode(secret);
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  if (pathname.startsWith(AUTH_API_PREFIX)) {
    return NextResponse.next();
  }

  if (pathname.startsWith(WEBHOOKS_API_PREFIX)) {
    return NextResponse.next();
  }

  const isPublicRoute = PUBLIC_ROUTES.includes(pathname);
  const token = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value;

  if (isPublicRoute) {
    if (token) {
      try {
        await jwtVerify(token, getAccessSecret());
        if (pathname === "/login" || pathname === "/register") {
          return NextResponse.redirect(new URL("/dashboard", request.url));
        }
      } catch {
        // token invalid — let them stay on public route
      }
    }
    return NextResponse.next();
  }

  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  try {
    const { payload } = await jwtVerify(token, getAccessSecret());

    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-user-id", payload.sub as string);
    requestHeaders.set("x-company-id", payload.companyId as string);
    requestHeaders.set("x-user-role", payload.role as string);
    requestHeaders.set("x-user-email", payload.email as string);

    return NextResponse.next({
      request: { headers: requestHeaders },
    });
  } catch {
    return NextResponse.redirect(new URL("/login", request.url));
  }
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
