import { addDays, addMonths, addWeeks } from "date-fns";
import { NextResponse } from "next/server";

import { getSessionUser } from "@/lib/session";
import { buildStudyPlan, parsePdf } from "@/lib/planner";
import { createStudyPlan } from "@/lib/study";
import { studyPlanSchema } from "@/lib/validators";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  if (!file) {
    return NextResponse.json({ error: "Missing PDF file" }, { status: 400 });
  }

  const payload = studyPlanSchema.safeParse({
    title: formData.get("title"),
    durationValue: formData.get("durationValue"),
    durationUnit: formData.get("durationUnit")
  });

  if (!payload.success) {
    return NextResponse.json({ error: "Invalid study plan details" }, { status: 400 });
  }

  const { title, durationUnit, durationValue } = payload.data;
  const buffer = Buffer.from(await file.arrayBuffer());
  try {
    const text = await parsePdf(buffer);
    const start = new Date();
    const end =
      durationUnit === "days"
        ? addDays(start, durationValue - 1)
        : durationUnit === "weeks"
        ? addDays(addWeeks(start, durationValue), -1)
        : addDays(addMonths(start, durationValue), -1);

    const planPayload = buildStudyPlan(text, start, end);
    const { plan, days } = createStudyPlan(
      user.id,
      title,
      file.name || "Uploaded PDF",
      start,
      end,
      {
        ...planPayload
      }
    );

    return NextResponse.json({
      plan: {
        ...plan
      },
      days: days.map((day) => ({
        ...day,
        completed: Boolean(day.completed)
      }))
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to process the uploaded PDF.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
