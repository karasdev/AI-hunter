"use client";

import { signIn } from "next-auth/react";
import { Loader2, Sparkles } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";

function LoginForm() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";
  const err = searchParams.get("error");
  const registered = searchParams.get("registered");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const email = String(fd.get("email") || "");
    const password = String(fd.get("password") || "");
    await signIn("credentials", {
      email,
      password,
      callbackUrl,
    });
    setLoading(false);
  }

  return (
    <form
      onSubmit={onSubmit}
      className="mx-auto mt-8 max-w-md rounded-2xl border border-zinc-200/80 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
    >
      <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">Sign in</h1>
      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
        Use the email and password you registered with.
      </p>
      {registered === "1" && (
        <p className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-200">
          Account created. You can sign in now.
        </p>
      )}
      {err && (
        <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200">
          Sign in failed. Check your email and password.
        </p>
      )}
      <label className="mt-6 block text-sm font-medium" htmlFor="email">
        Email
      </label>
      <input
        id="email"
        name="email"
        type="email"
        autoComplete="email"
        required
        className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
      />
      <label className="mt-4 block text-sm font-medium" htmlFor="password">
        Password
      </label>
      <input
        id="password"
        name="password"
        type="password"
        autoComplete="current-password"
        required
        className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
      />
      <button
        type="submit"
        disabled={loading}
        className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-amber-600 py-2.5 text-sm font-medium text-white hover:bg-amber-500 disabled:opacity-60 dark:bg-amber-500 dark:hover:bg-amber-400"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        Sign in
      </button>
      <p className="mt-6 text-center text-sm text-zinc-600 dark:text-zinc-400">
        No account?{" "}
        <Link href="/register" className="font-medium text-amber-700 hover:underline dark:text-amber-400">
          Create one
        </Link>
      </p>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-full bg-zinc-50 px-4 py-12 dark:bg-zinc-950">
      <div className="mx-auto max-w-lg text-center">
        <Link href="/" className="inline-flex items-center gap-2 text-amber-600 dark:text-amber-400">
          <Sparkles className="h-6 w-6" aria-hidden />
          <span className="text-sm font-semibold uppercase tracking-wide">AI Hunter</span>
        </Link>
      </div>
      <Suspense fallback={<div className="mx-auto mt-8 max-w-md text-center text-zinc-500">Loading…</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
