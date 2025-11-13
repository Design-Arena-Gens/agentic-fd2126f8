import { NextResponse } from "next/server";

import { getSessionUser } from "@/lib/session";
import { getStudyPlan } from "@/lib/study";

interface Params {
  params: {
    planId: string;
  };
}

export async function GET(_: Request, { params }: Params) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const result = getStudyPlan(params.planId, user.id);
  if (!result) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({
    plan: result.plan,
    days: result.days
  });
}
