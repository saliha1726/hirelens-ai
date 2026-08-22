"use client";

import { useEffect, useState } from "react";
import { Sparkles, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/primitives";
import { getState, resetWorkspace } from "@/lib/client/store";
import { buildDemoWorkspace } from "@/lib/sample-data";

/**
 * Seeds demo data on first visit and offers a reset. Runs the REAL pipeline
 * (parsing + scoring) so demo numbers are genuine engine output.
 */
export function DemoDataManager() {
  const [ready, setReady] = useState(false);
  const [isEmpty, setIsEmpty] = useState(false);

  useEffect(() => {
    const s = getState();
    const empty = s.candidates.length === 0 && s.jobs.length === 0;
    if (empty && !window.localStorage.getItem("hirelens.demo.seeded")) {
      resetWorkspace(buildDemoWorkspace());
      window.localStorage.setItem("hirelens.demo.seeded", "1");
    }
    setIsEmpty(getState().candidates.length === 0);
    setReady(true);
  }, []);

  if (!ready || !isEmpty) return null;

  return (
    <div className="animate-fade-in mb-6 flex flex-col items-start justify-between gap-3 rounded-2xl border border-brand-200 bg-gradient-to-r from-brand-50 to-violet-50 p-4 sm:flex-row sm:items-center dark:border-brand-500/25 dark:from-brand-950/40 dark:to-violet-950/30">
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-600/10 text-brand-600 dark:text-brand-400">
          <Sparkles className="h-4 w-4" />
        </span>
        <div>
          <p className="text-sm font-medium">Your workspace is empty</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Load sample candidates & jobs to explore the product instantly.
          </p>
        </div>
      </div>
      <Button
        size="sm"
        variant="outline"
        onClick={() => {
          resetWorkspace(buildDemoWorkspace());
          setIsEmpty(false);
        }}
      >
        <RotateCcw className="mr-1 h-3.5 w-3.5" /> Load demo data
      </Button>
    </div>
  );
}
