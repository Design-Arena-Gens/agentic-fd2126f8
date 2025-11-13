import { NextResponse } from "next/server";

import { getSessionUser } from "@/lib/session";
import { markStudyDay } from "@/lib/study";
import { progressUpdateSchema } from "@/lib/validators";

interface Params {
  params: {
    planId: string;
  };
}

export async function POST(request: Request, { params }: Params) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = progressUpdateSchema.safeParse({
    ...body,
    planId: params.planId
  });

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const { completed, dayId, notes, planId } = parsed.data;
  markStudyDay(planId, dayId, completed, notes);

  return NextResponse.json({ ok: true });
}
