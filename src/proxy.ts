import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { AUTH_COOKIE_NAME } from "@/app/lib/auth-constants";

const publicRoutes = ["/login","/verify_email","/reset-password"];
const authRoutes = ["/login","/verify_email","/reset-password"];

async function verifyTokenEdge(token: string): Promise<boolean> {
  const secret = process.env.JWT_SECRET;
  if (!secret) return false;

  try {
    await jwtVerify(token, new TextEncoder().encode(secret));
    return true;
  } catch {
    return false;
  }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  const isAuthenticated = token ? await verifyTokenEdge(token) : false;

  const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route));
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));
  const isApiRoute = pathname.startsWith("/api");

  
  if (isApiRoute) {
    return NextResponse.next();
  }
  
  if (isAuthRoute && isAuthenticated) {
    return NextResponse.redirect(new URL("/projects", request.url));
  }
  
  if(pathname==="/"){
     return NextResponse.redirect(new URL("/projects", request.url));
  }
  if (!isPublicRoute && !isAuthenticated) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
