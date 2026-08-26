import { NextResponse } from "next/server";

const ACCESS_TOKEN_COOKIE = "access_token";

const isAuthenticated = (request) =>
  Boolean(
    request.cookies.get(ACCESS_TOKEN_COOKIE)?.value ||
      request.cookies.get("token")?.value ||
      request.cookies.get("auth_token")?.value,
  );

export function proxy(request) {
  const { pathname, search } = request.nextUrl;
  const authenticated = isAuthenticated(request);

  if (pathname === "/login" && authenticated) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (pathname === "/login") {
    return NextResponse.next();
  }

  if (!authenticated) {
    const loginUrl = new URL("/login", request.url);
    const callbackUrl = `${pathname}${search}`;

    loginUrl.searchParams.set("callbackUrl", callbackUrl);

    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/dashboard/:path*",
    "/cars/:path*",
    "/categories/:path*",
    "/profile/:path*",
    "/admins/:path*",
    "/login",
  ],
};
