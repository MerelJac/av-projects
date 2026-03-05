// src/middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(req: NextRequest) {
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  });

  // 🔒 Not logged in
  if (!token) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const trainerOnlyPaths = ["/exercises", "/programs", "/trainer"];

  const isTrainerRoute = trainerOnlyPaths.some((path) =>
    req.nextUrl.pathname.startsWith(path),
  );

  // 🔒 Role guard
  if (
    isTrainerRoute &&
    (!token || (token.role !== "TEAM" && token.role !== "ADMIN"))
  ) {
    console.log(
      `Blocked ${req.nextUrl.pathname} — role was: ${token?.role ?? "MISSING"}`,
    );
    return NextResponse.redirect(new URL("/client", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/exercises/:path*", "/programs/:path*", "/trainer/:path*"],
};
