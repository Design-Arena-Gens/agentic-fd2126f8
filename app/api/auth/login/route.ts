import { NextResponse } from "next/server";

import { TOKEN_COOKIE, TOKEN_TTL_HOURS } from "@/lib/config";
import { createSessionToken, verifyUser } from "@/lib/auth";
import { loginSchema } from "@/lib/validators";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = loginSchema.parse(body);

    const user = await verifyUser(email, password);
    const token = createSessionToken(user);

    const res = NextResponse.json({
      user: { id: user.id, email: user.email }
    });

    res.cookies.set(TOKEN_COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: TOKEN_TTL_HOURS * 3600,
      path: "/"
    });

    return res;
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: "Unable to sign in" }, { status: 400 });
  }
}
