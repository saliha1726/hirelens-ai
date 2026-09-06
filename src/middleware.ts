import { type NextRequest, NextResponse } from "next/server";

const SESSION_COOKIE = "__session";

export async function middleware(request: NextRequest) {
  const response = NextResponse.next({ request });
  const isPublicPage =
    request.nextUrl.pathname.startsWith("/apply") ||
    request.nextUrl.pathname.startsWith("/jobs-board") ||
    request.nextUrl.pathname === "/";

  const isAuthPage =
    request.nextUrl.pathname.startsWith("/login") ||
    request.nextUrl.pathname.startsWith("/signup") ||
    request.nextUrl.pathname.startsWith("/forgot-password") ||
    request.nextUrl.pathname.startsWith("/reset-password");
  const isApiRoute = request.nextUrl.pathname.startsWith("/api");
  const isPublicAsset =
    request.nextUrl.pathname.startsWith("/_next") ||
    request.nextUrl.pathname.startsWith("/favicon") ||
    request.nextUrl.pathname.includes(".");

  const sessionCookie = request.cookies.get(SESSION_COOKIE)?.value;
  const isAuthed = !!sessionCookie && sessionCookie.length > 0;

  if (!isAuthed && !isAuthPage && !isApiRoute && !isPublicAsset && !isPublicPage) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (isAuthed && isAuthPage) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
