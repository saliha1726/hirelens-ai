"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return <div className={cn("h-9 w-9 rounded-xl", className)} aria-hidden />;
  }

  const isDark = resolvedTheme === "dark";
  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className={cn(
        "focus-ring relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-white text-slate-600 transition-colors hover:text-brand-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:text-brand-400",
        className,
      )}
    >
      <Sun className={cn("absolute h-4.5 w-4.5 h-[18px] w-[18px] transition-all duration-500", isDark ? "-translate-y-8 rotate-90 opacity-0" : "translate-y-0 rotate-0 opacity-100")} />
      <Moon className={cn("absolute h-[18px] w-[18px] transition-all duration-500", isDark ? "translate-y-0 rotate-0 opacity-100" : "translate-y-8 -rotate-90 opacity-0")} />
    </button>
  );
}
