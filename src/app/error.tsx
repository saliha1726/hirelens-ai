"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // Client-side breadcrumb only — never send stack traces anywhere.
    console.error("UI error boundary hit");
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50 text-amber-500 dark:bg-amber-950/50">
        <AlertTriangle className="h-8 w-8" />
      </span>
      <h1 className="text-2xl font-bold tracking-tight">Something went wrong</h1>
      <p className="max-w-md text-sm text-slate-500 dark:text-slate-400">
        An unexpected error occurred while rendering this view. Your workspace data is safe.
      </p>
      <button
        onClick={reset}
        className="focus-ring inline-flex h-10 items-center rounded-xl bg-brand-600 px-5 text-sm font-medium text-white transition-colors hover:bg-brand-500"
      >
        Try again
      </button>
    </div>
  );
}
