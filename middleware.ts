import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { TEACHER_COOKIE } from "@/lib/auth/teacher";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/teacher/auth")) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/teacher")) {
    const session = request.cookies.get(TEACHER_COOKIE)?.value;
    const validToken = process.env.TEACHER_AUTH_TOKEN;

    if (!validToken || session !== validToken) {
      return NextResponse.redirect(
        new URL("/teacher/auth/unauthorized", request.url),
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/teacher/:path*"],
};
