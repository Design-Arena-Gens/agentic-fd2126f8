"use client";

import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, Circle, ListChecks, Sparkles, Target } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import type { PlanBundle, StudyDay } from "./dashboard";

type Props = {
  bundle: PlanBundle | undefined;
  isLoading: boolean;
  onToggleGoal: (day: StudyDay) => void;
};

export function PlanDetails({ bundle, isLoading, onToggleGoal }: Props) {
  const [selectedDayId, setSelectedDayId] = useState<string | null>(null);

  useEffect(() => {
    if (!bundle) {
      setSelectedDayId(null);
      return;
    }
    const firstActive =
      bundle.days.find((day) => !day.completed)?.id ?? bundle.days[0]?.id ?? null;
    setSelectedDayId(firstActive);
  }, [bundle]);

  const selectedDay = useMemo(() => {
    if (!bundle || !selectedDayId) return null;
    return bundle.days.find((day) => day.id === selectedDayId) ?? null;
  }, [bundle, selectedDayId]);

  if (isLoading) {
    return (
      <Card className="min-h-[320px]">
        <CardHeader>
          <CardTitle>Plan insights</CardTitle>
          <CardDescription>Loading your study plan details...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!bundle) {
    return (
      <Card className="min-h-[320px]">
        <CardHeader>
          <CardTitle>Plan insights</CardTitle>
          <CardDescription>
            Select a study plan to view AI-powered summaries and daily goals.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const completed = bundle.days.filter((day) => day.completed).length;
  const progress = Math.round((completed / bundle.days.length) * 100);

  return (
    <Card className="min-h-[400px]">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <ListChecks className="h-5 w-5 text-primary" />
              {bundle.plan.title}
            </CardTitle>
            <CardDescription>
              Key concepts from {bundle.plan.source_name} with a personalized daily cadence.
            </CardDescription>
          </div>
          <div className="text-right text-sm text-slate-500 dark:text-slate-400">
            Progress: <span className="font-semibold text-primary">{progress}%</span>
          </div>
        </div>
        <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <section className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
          <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">
            <Sparkles className="h-4 w-4 text-primary" />
            AI Summary
          </h3>
          <p className="text-sm leading-6 text-slate-700 dark:text-slate-300">
            {bundle.plan.summary}
          </p>
        </section>

        <section className="space-y-2">
          <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">
            <Target className="h-4 w-4 text-primary" />
            Key Highlights
          </h3>
          <ul className="grid gap-2">
            {bundle.plan.highlights.map((highlight, index) => (
              <li
                key={`${index}-${highlight.slice(0, 12)}`}
                className="rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-700 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
              >
                {highlight}
              </li>
            ))}
          </ul>
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">
              Daily Study Goals
            </h3>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {completed} / {bundle.days.length} complete
            </span>
          </div>
          <ul className="flex max-h-[220px] flex-col gap-2 overflow-y-auto pr-1">
            <AnimatePresence initial={false}>
              {bundle.days.map((day) => (
                <motion.li
                  key={day.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <button
                    onClick={() => setSelectedDayId(day.id)}
                    className={`flex w-full items-start gap-3 rounded-lg border px-4 py-3 text-left transition ${
                      day.completed
                        ? "border-emerald-400 bg-emerald-50 dark:border-emerald-600/70 dark:bg-emerald-900/30"
                        : "border-slate-200 hover:border-primary hover:bg-primary/5 dark:border-slate-800 dark:hover:border-primary/70"
                    } ${selectedDayId === day.id ? "ring-2 ring-primary/60" : ""}`}
                  >
                    {day.completed ? (
                      <CheckCircle2 className="mt-1 h-5 w-5 text-emerald-500" />
                    ) : (
                      <Circle className="mt-1 h-5 w-5 text-slate-400" />
                    )}
                    <div className="space-y-1">
                      <p className="text-xs uppercase text-slate-500 dark:text-slate-400">
                        Day {day.day_index + 1} • {day.target_date}
                      </p>
                      <p className="text-sm text-slate-700 dark:text-slate-200">{day.goal}</p>
                    </div>
                  </button>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        </section>

        {selectedDay && (
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase text-slate-500 dark:text-slate-400">
                  Day {selectedDay.day_index + 1} • {selectedDay.target_date}
                </p>
                <p className="text-sm text-slate-700 dark:text-slate-200">{selectedDay.goal}</p>
              </div>
              <Button variant="outline" onClick={() => onToggleGoal(selectedDay)}>
                {selectedDay.completed ? "Mark incomplete" : "Mark complete"}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
