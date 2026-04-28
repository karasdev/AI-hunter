"use client";

import { LogOut, User } from "lucide-react";
import { signOut, useSession } from "next-auth/react";

export function UserMenu() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <span className="text-xs text-zinc-500" aria-live="polite">
        …
      </span>
    );
  }

  if (!session?.user) return null;

  return (
    <div className="flex flex-wrap items-center gap-3">
      <span className="flex items-center gap-1.5 text-sm text-zinc-600 dark:text-zinc-400">
        <User className="h-4 w-4 shrink-0" aria-hidden />
        <span className="max-w-[200px] truncate">{session.user.email}</span>
      </span>
      <button
        type="button"
        onClick={() => signOut({ callbackUrl: "/login" })}
        className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-800 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
      >
        <LogOut className="h-3.5 w-3.5" aria-hidden />
        Sign out
      </button>
    </div>
  );
}
