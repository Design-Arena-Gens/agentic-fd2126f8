import { NextResponse } from "next/server";

import { TOKEN_COOKIE } from "@/lib/config";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(TOKEN_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 0,
    path: "/"
  });
  return response;
}
