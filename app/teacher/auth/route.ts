import { NextRequest, NextResponse } from "next/server";
import {
  getTeacherAuthToken,
  getTeacherSessionCookieOptions,
  TEACHER_COOKIE,
} from "@/lib/auth/teacher";

export function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");
  const unauthorizedUrl = new URL("/teacher/auth/unauthorized", request.url);

  if (!token) {
    return NextResponse.redirect(unauthorizedUrl);
  }

  try {
    if (token !== getTeacherAuthToken()) {
      return NextResponse.redirect(unauthorizedUrl);
    }
  } catch {
    return NextResponse.redirect(unauthorizedUrl);
  }

  const response = NextResponse.redirect(new URL("/teacher", request.url));
  response.cookies.set(
    TEACHER_COOKIE,
    getTeacherAuthToken(),
    getTeacherSessionCookieOptions(),
  );

  return response;
}
