import { cookies } from "next/headers";

import { TOKEN_COOKIE } from "./config";
import { findUserById, verifySessionToken } from "./auth";

export async function getSessionUser() {
  const token = cookies().get(TOKEN_COOKIE)?.value;
  if (!token) {
    return null;
  }

  try {
    const payload = verifySessionToken(token);
    const user = findUserById(payload.sub);
    return user ?? null;
  } catch {
    return null;
  }
}
