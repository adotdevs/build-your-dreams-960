import { NextResponse } from "next/server";
import { SESSION_COOKIE } from "./auth";

export function jsonWithSession(body: unknown, token?: string | null, clear = false) {
  const response = NextResponse.json(body);
  if (clear) {
    response.cookies.set(SESSION_COOKIE, "", { httpOnly: true, sameSite: "lax", path: "/", maxAge: 0 });
  } else if (token) {
    response.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 14,
    });
  }
  return response;
}
