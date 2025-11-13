import { NextResponse } from "next/server";

import { getSessionUser } from "@/lib/session";
import { listStudyPlans } from "@/lib/study";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const plans = listStudyPlans(user.id);
  return NextResponse.json({ plans });
}
