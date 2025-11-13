import Link from "next/link";
import { redirect } from "next/navigation";

import { LoginForm } from "@/components/auth/login-form";
import { ThemeToggle } from "@/components/theme-toggle";
import { getSessionUser } from "@/lib/session";

export const metadata = {
  title: "Sign in • Self Study"
};

export default async function LoginPage() {
  const user = await getSessionUser();
  if (user) {
    redirect("/");
  }

  return (
    <div className="grid min-h-screen grid-cols-1 md:grid-cols-2">
      <section className="relative hidden h-full flex-col justify-between bg-gradient-to-br from-primary via-sky-500 to-indigo-600 p-10 text-white md:flex">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-white/70">Self Study</p>
          <h1 className="mt-4 text-3xl font-semibold leading-tight">
            Study smarter with AI-powered insights tailored for your deadlines.
          </h1>
        </div>
        <p className="text-sm text-white/80">
          Upload textbooks, extract key concepts, and stay on track with intelligent reminders.
        </p>
      </section>
      <section className="relative flex flex-col justify-center bg-white px-6 py-12 dark:bg-slate-950 sm:px-12">
        <div className="absolute right-6 top-6">
          <ThemeToggle />
        </div>
        <div className="mx-auto w-full max-w-md space-y-8">
          <div className="space-y-2 text-center">
            <h2 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">
              Welcome back
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Sign in to access your personalized study plans.
            </p>
          </div>

          <LoginForm />

          <p className="text-center text-sm text-slate-500 dark:text-slate-400">
            No account yet?{" "}
            <Link className="font-medium text-primary hover:underline" href="/register">
              Create one
            </Link>
          </p>
        </div>
      </section>
    </div>
  );
}
