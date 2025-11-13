import { redirect } from "next/navigation";

import { Dashboard } from "@/components/dashboard/dashboard";
import { LogoutButton } from "@/components/logout-button";
import { ThemeToggle } from "@/components/theme-toggle";
import { getSessionUser } from "@/lib/session";
import { listStudyPlans } from "@/lib/study";

export default async function HomePage() {
  const user = await getSessionUser();
  if (!user) {
    redirect("/login");
  }

  const plans = listStudyPlans(user.id);

  return (
    <div className="min-h-screen bg-gradient-to-tr from-slate-100 via-slate-50 to-white dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/80 backdrop-blur dark:border-slate-800 dark:bg-slate-900/80">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div>
            <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
              Self Study
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Personalized AI-powered study plans to help you stay on track.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-slate-600 dark:text-slate-300 sm:inline">
              {user.email}
            </span>
            <ThemeToggle />
            <LogoutButton />
          </div>
        </div>
      </header>

      <main className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-8">
        <Dashboard initialPlans={plans} />
      </main>
    </div>
  );
}
