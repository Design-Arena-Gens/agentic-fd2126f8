"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { differenceInCalendarDays, format, isToday, parseISO } from "date-fns";
import { Bell, BookOpen, CalendarClock, Clock, FileText, Loader2, Trophy } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { CreatePlanForm } from "./create-plan-form";
import { PlanDetails } from "./plan-details";

export type DashboardPlan = {
  id: string;
  title: string;
  source_name: string;
  summary: string;
  highlights: string[];
  total_units: number;
  start_date: string;
  end_date: string;
  created_at: string;
  updated_at: string;
};

export type StudyDay = {
  id: string;
  plan_id: string;
  day_index: number;
  target_date: string;
  goal: string;
  completed: boolean;
  notes: string | null;
};

export type PlanBundle = {
  plan: DashboardPlan;
  days: StudyDay[];
};

async function fetchPlans() {
  const response = await fetch("/api/study-plans", {
    credentials: "include"
  });
  if (!response.ok) {
    throw new Error("Failed to load study plans");
  }
  const data = await response.json();
  return data.plans as DashboardPlan[];
}

async function fetchPlanDetails(planId: string) {
  const response = await fetch(`/api/study-plans/${planId}`, {
    credentials: "include"
  });
  if (!response.ok) {
    throw new Error("Failed to load study plan");
  }
  return (await response.json()) as PlanBundle;
}

async function markProgress(
  planId: string,
  dayId: string,
  completed: boolean,
  notes: string | null
) {
  const response = await fetch(`/api/study-plans/${planId}/progress`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ dayId, completed, notes })
  });

  if (!response.ok) {
    throw new Error("Failed to update progress");
  }
}

async function createPlan(formData: FormData) {
  const response = await fetch("/api/upload", {
    method: "POST",
    body: formData,
    credentials: "include"
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Upload failed" }));
    throw new Error(error.error ?? "Upload failed");
  }
  return (await response.json()) as PlanBundle;
}

type DashboardProps = {
  initialPlans: DashboardPlan[];
};

export function Dashboard({ initialPlans }: DashboardProps) {
  const queryClient = useQueryClient();
  const {
    data: plans,
    isLoading,
    isFetching
  } = useQuery({
    queryKey: ["plans"],
    queryFn: fetchPlans,
    initialData: initialPlans
  });

  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(plans[0]?.id ?? null);

  const {
    data: selectedPlan,
    isLoading: detailsLoading
  } = useQuery({
    queryKey: ["plan", selectedPlanId],
    queryFn: () => fetchPlanDetails(selectedPlanId!),
    enabled: Boolean(selectedPlanId)
  });

  const createPlanMutation = useMutation({
    mutationFn: createPlan,
    onSuccess: (bundle) => {
      toast.success("Study plan created");
      queryClient.invalidateQueries({ queryKey: ["plans"] });
      queryClient.setQueryData(["plan", bundle.plan.id], bundle);
      setSelectedPlanId(bundle.plan.id);
      if ("Notification" in window && Notification.permission === "default") {
        Notification.requestPermission().catch(() => undefined);
      }
    },
    onError: (error: Error) => {
      toast.error(error.message);
    }
  });

  const progressMutation = useMutation({
    mutationFn: ({ dayId, completed, notes }: { dayId: string; completed: boolean; notes: string | null }) =>
      markProgress(selectedPlanId!, dayId, completed, notes),
    onSuccess: () => {
      toast.success("Progress updated");
      queryClient.invalidateQueries({ queryKey: ["plan", selectedPlanId] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    }
  });

  useEffect(() => {
    if (!("Notification" in window)) {
      return;
    }
    if (Notification.permission === "default") {
      Notification.requestPermission().catch(() => undefined);
    }
  }, []);

  useEffect(() => {
    if (!selectedPlan?.days || !("Notification" in window) || Notification.permission !== "granted") {
      return;
    }

    const upcoming = selectedPlan.days.find(
      (day) => !day.completed && parseISO(day.target_date) >= new Date()
    );

    if (!upcoming) {
      return;
    }

    const timeout = window.setTimeout(() => {
      new Notification("Self Study Reminder", {
        body: `Today's goal: ${upcoming.goal.slice(0, 120)}...`
      });
    }, 3000);

    return () => window.clearTimeout(timeout);
  }, [selectedPlan]);

  const stats = useMemo(() => {
    if (!selectedPlan) {
      return null;
    }
    const { plan, days } = selectedPlan;
    const completed = days.filter((day) => day.completed).length;
    const remaining = days.length - completed;
    const percentComplete = Math.round((completed / (days.length || 1)) * 100);
    const today = days.find((day) => isToday(parseISO(day.target_date)));
    const daysLeft = differenceInCalendarDays(parseISO(plan.end_date), new Date());

    return {
      percentComplete,
      completed,
      remaining,
      todayGoal: today?.goal,
      daysLeft: daysLeft >= 0 ? daysLeft : 0
    };
  }, [selectedPlan]);

  return (
    <div className="flex flex-col gap-8 lg:flex-row">
      <div className="flex-1 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Create a study plan</CardTitle>
            <CardDescription>
              Upload your textbook or notes, set a deadline, and let the AI craft a tailored
              schedule.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CreatePlanForm
              onSubmit={async (formData) => {
                await createPlanMutation.mutateAsync(formData);
              }}
              isSubmitting={createPlanMutation.isPending}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              Daily insights
            </CardTitle>
            <CardDescription>
              Stay on track with AI highlights and actionable reminders.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {stats ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <StatsTile
                  icon={<Trophy className="h-6 w-6 text-emerald-500" />}
                  label="Completion"
                  value={`${stats.percentComplete}%`}
                  detail={`${stats.completed} of ${selectedPlan?.days.length} goals`}
                />
                <StatsTile
                  icon={<Clock className="h-6 w-6 text-sky-500" />}
                  label="Days remaining"
                  value={`${stats.daysLeft}`}
                  detail="Keep the momentum going!"
                />
                <StatsTile
                  icon={<CalendarClock className="h-6 w-6 text-indigo-500" />}
                  label="Today’s focus"
                  value={stats.todayGoal ? "Ready" : "Free Day"}
                  detail={stats.todayGoal ? stats.todayGoal.slice(0, 80) + "..." : "No goal scheduled"}
                />
                <StatsTile
                  icon={<BookOpen className="h-6 w-6 text-amber-500" />}
                  label="Remaining goals"
                  value={`${stats.remaining}`}
                  detail="Plan your revision time now"
                />
              </div>
            ) : (
              <p className="text-sm text-slate-500">
                Create a plan to unlock tailored daily reminders and insights.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="flex-1 space-y-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-3">
            <div>
              <CardTitle>Active study plans</CardTitle>
              <CardDescription>Manage progress and drill into your materials.</CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => queryClient.invalidateQueries({ queryKey: ["plans"] })}
              disabled={isFetching}
            >
              {isFetching ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Refreshing
                </>
              ) : (
                "Refresh"
              )}
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading && <p className="text-sm text-slate-500">Loading plans...</p>}
            {!plans.length && !isLoading && (
              <div className="rounded-lg border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500 dark:border-slate-700">
                Upload a PDF to kickstart your personalized study roadmap.
              </div>
            )}
            <div className="flex flex-col gap-3">
              {plans.map((plan) => (
                <button
                  key={plan.id}
                  onClick={() => setSelectedPlanId(plan.id)}
                  className={`flex items-start gap-3 rounded-lg border px-4 py-3 text-left transition hover:border-primary hover:bg-primary/5 dark:hover:border-primary/70 ${
                    plan.id === selectedPlanId
                      ? "border-primary bg-primary/10 dark:border-primary/70"
                      : "border-slate-200 dark:border-slate-800"
                  }`}
                >
                  <FileText className="mt-1 h-5 w-5 text-primary" />
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-slate-50">
                      {plan.title}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {format(parseISO(plan.start_date), "MMM d")} -{" "}
                      {format(parseISO(plan.end_date), "MMM d, yyyy")}
                    </p>
                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                      {plan.highlights[0]?.slice(0, 100) ?? plan.summary.slice(0, 100)}...
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        <PlanDetails
          bundle={selectedPlan}
          isLoading={detailsLoading || !selectedPlanId}
          onToggleGoal={(day) =>
            progressMutation.mutate({
              dayId: day.id,
              completed: !day.completed,
              notes: day.notes ?? null
            })
          }
        />
      </div>
    </div>
  );
}

function StatsTile({
  icon,
  label,
  value,
  detail
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-500 dark:text-slate-400">
        {icon}
        {label}
      </div>
      <p className="text-2xl font-semibold text-slate-900 dark:text-slate-100">{value}</p>
      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{detail}</p>
    </div>
  );
}
