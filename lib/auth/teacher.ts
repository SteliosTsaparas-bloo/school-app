import { cookies } from "next/headers";

export const TEACHER_COOKIE = "teacher_session";

export const SESSION_MAX_AGE = 60 * 60 * 24 * 30;

export function getTeacherAuthToken() {
  const token = process.env.TEACHER_AUTH_TOKEN;
  if (!token) {
    throw new Error("TEACHER_AUTH_TOKEN is not set in environment variables.");
  }
  return token;
}

export function getTeacherSessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: SESSION_MAX_AGE,
  };
}

export async function isTeacherAuthenticated() {
  const cookieStore = await cookies();
  const session = cookieStore.get(TEACHER_COOKIE)?.value;

  try {
    return session === getTeacherAuthToken();
  } catch {
    return false;
  }
}

export async function clearTeacherSession() {
  const cookieStore = await cookies();
  cookieStore.delete(TEACHER_COOKIE);
}
