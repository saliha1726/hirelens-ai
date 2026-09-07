"use client";

import { useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { AlertTriangle, CalendarClock, ChevronRight, TrendingUp, Clock, Users } from "lucide-react";
import { useWorkspace } from "@/lib/client/store";
import { Card, CardContent } from "@/components/ui/primitives";
import { cn, timeAgo } from "@/lib/utils";

/** Candidates inactive in an active stage for over 14 days. */
const STALLED_DAYS = 14;
const ACTIVE_STAGES = ["new", "screening", "shortlisted", "interview"];

export function AttentionPanel() {
  const ws = useWorkspace();

  const { stalled, upcomingInterviews } = useMemo(() => {
    const now = Date.now();
    const stalledCutoff = now - STALLED_DAYS * 24 * 60 * 60 * 1000;

    const stalled = ws.candidates
      .filter((c) => {
        if (!ACTIVE_STAGES.includes(c.status)) return false;
        const lastActivity = Math.max(
          new Date(c.createdAt).getTime(),
          ...c.notes.map((n) => new Date(n.createdAt).getTime()),
          ...c.interviews?.map((i) => new Date(i.createdAt).getTime()) ?? [],
        );
        return lastActivity < stalledCutoff;
      })
      .slice(0, 5);

    const upcoming = ws.candidates
      .flatMap((c) =>
        (c.interviews ?? [])
          .filter((i) => new Date(i.scheduledAt).getTime() > now)
          .map((i) => ({ candidate: c, interview: i })),
      )
      .sort((a, b) => new Date(a.interview.scheduledAt).getTime() - new Date(b.interview.scheduledAt).getTime())
      .slice(0, 5);

    return { stalled, upcomingInterviews: upcoming };
  }, [ws.candidates]);

  if (stalled.length === 0 && upcomingInterviews.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="grid gap-5 lg:grid-cols-2"
    >
      {/* Upcoming interviews */}
      {upcomingInterviews.length > 0 && (
        <Card className="border-blue-200/70 dark:border-blue-500/25">
          <CardContent className="pt-5">
            <h3 className="flex items-center gap-2 text-sm font-semibold">
              <CalendarClock className="h-4 w-4 text-blue-500" /> Upcoming interviews
              <span className="ml-auto rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-600 dark:bg-blue-950/50 dark:text-blue-300">
                next 5
              </span>
            </h3>
            <div className="mt-3 space-y-2">
              {upcomingInterviews.map(({ candidate, interview }) => {
                const when = new Date(interview.scheduledAt);
                const daysAway = Math.ceil((when.getTime() - Date.now()) / (24 * 60 * 60 * 1000));
                return (
                  <Link
                    key={interview.id}
                    href={`/candidates/${candidate.id}`}
                    className="group flex items-center gap-3 rounded-xl border border-slate-200 p-2.5 transition-colors hover:border-blue-300 hover:bg-blue-50/40 dark:border-slate-700 dark:hover:border-blue-500/50 dark:hover:bg-blue-950/20"
                  >
                    <span className={cn(
                      "flex h-9 w-9 shrink-0 flex-col items-center justify-center rounded-lg text-[10px] font-bold leading-none",
                      daysAway <= 1
                        ? "bg-rose-100 text-rose-600 dark:bg-rose-950/50 dark:text-rose-300"
                        : "bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-300",
                    )}>
                      <span className="text-xs">{when.toLocaleDateString("en-US", { day: "numeric" })}</span>
                      <span>{when.toLocaleDateString("en-US", { month: "short" }).toUpperCase()}</span>
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {candidate.resume.name ?? candidate.applicantName ?? candidate.fileName}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        {when.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })} · {interview.duration} min · {interview.type}
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-300 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stalled candidates */}
      {stalled.length > 0 && (
        <Card className="border-amber-200/70 dark:border-amber-500/25">
          <CardContent className="pt-5">
            <h3 className="flex items-center gap-2 text-sm font-semibold">
              <AlertTriangle className="h-4 w-4 text-amber-500" /> Needs attention
              <span className="ml-auto rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-600 dark:bg-amber-950/50 dark:text-amber-300">
                {STALLED_DAYS}+ days idle
              </span>
            </h3>
            <p className="mt-1 text-[11px] text-slate-400">
              Candidates sitting in an active stage without recent activity.
            </p>
            <div className="mt-3 space-y-2">
              {stalled.map((c) => (
                <Link
                  key={c.id}
                  href={`/candidates/${c.id}`}
                  className="group flex items-center gap-3 rounded-xl border border-slate-200 p-2.5 transition-colors hover:border-amber-300 hover:bg-amber-50/40 dark:border-slate-700 dark:hover:border-amber-500/50 dark:hover:bg-amber-950/20"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-300">
                    <Clock className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {c.resume.name ?? c.applicantName ?? c.fileName}
                    </p>
                    <p className="text-[11px] capitalize text-slate-500 dark:text-slate-400">
                      {c.status} · added {timeAgo(c.createdAt)}
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-300 transition-transform group-hover:translate-x-0.5" />
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </motion.div>
  );
}
