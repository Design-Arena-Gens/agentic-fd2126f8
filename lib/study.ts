import { formatISO } from "date-fns";

import { readDb, writeDb } from "./db";
import type { StudyPlanPayload } from "./planner";
import type { StudyDayRecord, StudyPlanRecord } from "./types";

export type StudyPlan = StudyPlanRecord;

export type StudyDayWithStatus = StudyDayRecord;

export function createStudyPlan(
  userId: string,
  title: string,
  sourceName: string,
  start: Date,
  end: Date,
  payload: StudyPlanPayload
): { plan: StudyPlan; days: StudyDayRecord[] } {
  const now = formatISO(new Date());
  const planId = crypto.randomUUID();

  const plan: StudyPlan = {
    id: planId,
    user_id: userId,
    title,
    source_name: sourceName,
    summary: payload.summary,
    highlights: payload.highlights,
    total_units: payload.studyDays.length,
    start_date: formatISO(start, { representation: "date" }),
    end_date: formatISO(end, { representation: "date" }),
    created_at: now,
    updated_at: now
  };

  const studyDays: StudyDayRecord[] = payload.studyDays.map((day, index) => ({
    id: crypto.randomUUID(),
    plan_id: planId,
    day_index: index,
    target_date: formatISO(new Date(start.getTime() + index * 86400000), {
      representation: "date"
    }),
    goal: day.goal,
    completed: false,
    notes: null
  }));

  writeDb((state) => {
    state.studyPlans.push(plan);
    state.studyDays.push(...studyDays);
  });

  return {
    plan,
    days: studyDays
  };
}

export function listStudyPlans(userId: string): StudyPlan[] {
  const db = readDb();
  return db.studyPlans
    .filter((plan) => plan.user_id === userId)
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
}

export function getStudyPlan(
  planId: string,
  userId: string
): { plan: StudyPlan; days: StudyDayWithStatus[] } | null {
  const db = readDb();
  const plan = db.studyPlans.find((item) => item.id === planId && item.user_id === userId);
  if (!plan) {
    return null;
  }

  const days = db.studyDays
    .filter((day) => day.plan_id === planId)
    .sort((a, b) => a.day_index - b.day_index);

  return {
    plan,
    days
  };
}

export function markStudyDay(
  planId: string,
  dayId: string,
  completed: boolean,
  notes: string | null
) {
  writeDb((state) => {
    const day = state.studyDays.find((entry) => entry.id === dayId && entry.plan_id === planId);
    if (day) {
      day.completed = completed;
      day.notes = notes;
    }

    const plan = state.studyPlans.find((entry) => entry.id === planId);
    if (plan) {
      plan.updated_at = formatISO(new Date());
    }
  });
}
