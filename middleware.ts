import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify, JWTPayload } from "jose";

const JWT_SECRET = process.env.JWT_SECRET!;

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protect admin routes
  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    const token = request.cookies.get("token")?.value;
    console.log("=== Accessing admin page ===, token value = ", {token, secret: JWT_SECRET})

    if (!token) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
    // let tokenPayload = '' as JWTPayload | string
    try {
      const tokenPayload = jwtVerify(token, new TextEncoder().encode(JWT_SECRET));
      console.log("the admin token ", tokenPayload)
    } catch (error) {
        console.log("jwt verification failed", error)
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
