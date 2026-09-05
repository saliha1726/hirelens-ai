"use client";

import { useMemo, useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  BarChart3,
  TrendingUp,
  Users,
  Briefcase,
  Target,
  Award,
  AlertTriangle,
  Download,
} from "lucide-react";
import { useWorkspace } from "@/lib/client/store";
import { Card, CardContent, EmptyState, Skeleton } from "@/components/ui/primitives";
import { ScoreRing } from "@/components/ui/score-ring";
import { cn, scoreTone, TONE_STYLES } from "@/lib/utils";
import type { ScreeningStatus } from "@/lib/types";

const STATUS_PIPELINE: ScreeningStatus[] = ["new", "screening", "shortlisted", "interview", "hired", "rejected"];
const STATUS_COLORS: Record<ScreeningStatus, string> = {
  new: "bg-slate-400",
  screening: "bg-blue-500",
  shortlisted: "bg-emerald-500",
  interview: "bg-violet-500",
  hired: "bg-green-500",
  rejected: "bg-rose-500",
};

export default function AnalyticsPage() {
  const ws = useWorkspace();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const analytics = useMemo(() => {
    const allScores = ws.candidates.flatMap((c) => c.screenings.map((s) => s.match.overallScore));
    const avgScore = allScores.length ? Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length) : 0;
    const medianScore = allScores.length ? allScores.sort((a, b) => a - b)[Math.floor(allScores.length / 2)] : 0;
    const highScores = allScores.filter((s) => s >= 80).length;
    const lowScores = allScores.filter((s) => s < 50).length;

    // Score distribution
    const buckets = [0, 0, 0, 0, 0]; // 0-20, 20-40, 40-60, 60-80, 80-100
    for (const s of allScores) {
      const idx = Math.min(4, Math.floor(s / 20));
      buckets[idx]++;
    }

    // Pipeline funnel
    const pipeline: Record<string, number> = {};
    for (const status of STATUS_PIPELINE) {
      pipeline[status] = ws.candidates.filter((c) => c.status === status).length;
    }

    // Skill gap analysis
    const skillCounts: Record<string, { met: number; missing: number }> = {};
    for (const c of ws.candidates) {
      for (const s of c.screenings) {
        for (const skill of s.match.matchedSkills) {
          if (!skillCounts[skill]) skillCounts[skill] = { met: 0, missing: 0 };
          skillCounts[skill].met++;
        }
        for (const skill of s.match.missingSkills) {
          if (!skillCounts[skill]) skillCounts[skill] = { met: 0, missing: 0 };
          skillCounts[skill].missing++;
        }
      }
    }
    const topSkills = Object.entries(skillCounts)
      .map(([name, data]) => ({ name, ...data, total: data.met + data.missing }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);

    // Job performance
    const jobStats = ws.jobs.map((job) => {
      const scored = ws.candidates
        .map((c) => ({ c, s: c.screenings.find((x) => x.jobId === job.id) }))
        .filter((x) => x.s);
      const scores = scored.map((x) => x.s!.match.overallScore);
      return {
        job,
        count: scored.length,
        avg: scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0,
        best: scores.length ? Math.max(...scores) : 0,
      };
    });

    // Recent screenings over time
    const screeningsByDay: Record<string, number> = {};
    for (const c of ws.candidates) {
      for (const s of c.screenings) {
        const day = s.createdAt.slice(0, 10);
        screeningsByDay[day] = (screeningsByDay[day] || 0) + 1;
      }
    }
    const timeline = Object.entries(screeningsByDay)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-14);

    return { avgScore, medianScore, highScores, lowScores, buckets, pipeline, topSkills, jobStats, timeline, totalScreenings: allScores.length };
  }, [ws]);

  const funnel = useMemo(() => {
    const total = ws.candidates.length || 1;
    const stages = STATUS_PIPELINE.map((status) => ({
      status,
      count: ws.candidates.filter((c) => c.status === status).length,
    }));
    return stages.map((s, i) => ({
      ...s,
      pct: Math.round((s.count / total) * 100),
      conversionFromPrev: i > 0 && stages[i - 1].count > 0
        ? Math.round((s.count / stages[i - 1].count) * 100)
        : null,
    }));
  }, [ws]);

  if (!mounted) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-9 w-64" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28" />)}
        </div>
        <Skeleton className="h-72" />
      </div>
    );
  }

  if (ws.candidates.length === 0) {
    return (
      <div className="mx-auto max-w-6xl">
        <EmptyState
          icon={<BarChart3 className="h-6 w-6" />}
          title="No data to analyze"
          description="Run some screenings first to see analytics and insights about your candidates."
        />
      </div>
    );
  }

  const maxBucket = Math.max(...analytics.buckets, 1);

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Analytics</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Screening insights across {analytics.jobStats.length} jobs and {ws.candidates.length} candidates.
          </p>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Target} label="Avg match score" value={analytics.avgScore} suffix="%" delay={0} />
        <StatCard icon={TrendingUp} label="Median score" value={analytics.medianScore} suffix="%" delay={0.06} />
        <StatCard icon={Award} label="High matches (80+)" value={analytics.highScores} delay={0.12} />
        <StatCard icon={AlertTriangle} label="Low matches (<50)" value={analytics.lowScores} delay={0.18} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Score Distribution */}
        <Card>
          <div className="px-6 pt-5">
            <h2 className="font-semibold">Score distribution</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">{analytics.totalScreenings} total screenings</p>
          </div>
          <CardContent className="mt-4">
            <div className="flex items-end gap-2 h-40">
              {analytics.buckets.map((count, i) => (
                <div key={i} className="flex flex-1 flex-col items-center gap-1">
                  <span className="text-xs font-medium tabular-nums text-slate-500">{count}</span>
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${(count / maxBucket) * 100}%` }}
                    transition={{ delay: i * 0.08, duration: 0.5 }}
                    className={cn(
                      "w-full rounded-t-lg min-h-[4px]",
                      i <= 1 ? "bg-rose-400" : i === 2 ? "bg-amber-400" : i === 3 ? "bg-emerald-400" : "bg-green-500",
                    )}
                  />
                  <span className="text-[10px] text-slate-400">{i * 20}-{(i + 1) * 20}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Pipeline Funnel */}
        <Card>
          <div className="px-6 pt-5">
            <h2 className="font-semibold">Hiring pipeline</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Candidate status breakdown</p>
          </div>
          <CardContent className="mt-4 space-y-3">
            {STATUS_PIPELINE.filter((s) => analytics.pipeline[s] > 0 || s === "new").map((status) => {
              const count = analytics.pipeline[status];
              const pct = ws.candidates.length ? Math.round((count / ws.candidates.length) * 100) : 0;
              return (
                <div key={status} className="flex items-center gap-3">
                  <span className="w-24 text-xs font-medium capitalize text-slate-600 dark:text-slate-300">{status}</span>
                  <div className="flex-1 h-6 overflow-hidden rounded-lg bg-slate-100 dark:bg-slate-800">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.6 }}
                      className={cn("h-full rounded-lg", STATUS_COLORS[status])}
                    />
                  </div>
                  <span className="w-12 text-right text-xs font-medium tabular-nums text-slate-500">{count}</span>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Funnel Conversion */}
        <Card>
          <div className="px-6 pt-5">
            <h2 className="font-semibold">Hiring funnel</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Conversion rates between stages</p>
          </div>
          <CardContent className="mt-4">
            <div className="space-y-2">
              {funnel.map((stage, i) => (
                <div key={stage.status} className="flex items-center gap-3">
                  <span className="w-20 text-xs font-medium capitalize text-slate-600 dark:text-slate-300">{stage.status}</span>
                  <div className="flex-1 relative">
                    <div className="h-8 overflow-hidden rounded-lg bg-slate-100 dark:bg-slate-800">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${stage.pct}%` }}
                        transition={{ duration: 0.6, delay: i * 0.05 }}
                        className={cn("h-full rounded-lg", STATUS_COLORS[stage.status])}
                      />
                    </div>
                  </div>
                  <span className="w-10 text-right text-xs font-bold tabular-nums text-slate-600 dark:text-slate-300">{stage.count}</span>
                  {stage.conversionFromPrev !== null && (
                    <span className={cn(
                      "w-14 text-right text-[10px] font-medium tabular-nums",
                      stage.conversionFromPrev >= 50 ? "text-emerald-600" : stage.conversionFromPrev >= 25 ? "text-amber-600" : "text-rose-600",
                    )}>
                      {stage.conversionFromPrev}%
                    </span>
                  )}
                  {stage.conversionFromPrev === null && <span className="w-14" />}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Skills Gap */}
        <Card>
          <div className="px-6 pt-5">
            <h2 className="font-semibold">Skill frequency</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Most common skills across all screenings</p>
          </div>
          <CardContent className="mt-4 space-y-3">
            {analytics.topSkills.map((skill) => (
              <div key={skill.name} className="flex items-center gap-3">
                <span className="w-28 truncate text-xs font-medium text-slate-600 dark:text-slate-300">{skill.name}</span>
                <div className="flex-1 flex gap-0.5 h-5 overflow-hidden rounded-md">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(skill.met / skill.total) * 100}%` }}
                    transition={{ duration: 0.5 }}
                    className="h-full rounded-l-md bg-emerald-400"
                  />
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(skill.missing / skill.total) * 100}%` }}
                    transition={{ duration: 0.5 }}
                    className="h-full rounded-r-md bg-rose-300 dark:bg-rose-600"
                  />
                </div>
                <span className="w-16 text-right text-[10px] tabular-nums text-slate-400">
                  {skill.met}/{skill.total}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Job Performance */}
        <Card>
          <div className="px-6 pt-5">
            <h2 className="font-semibold">Job performance</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Average and best scores per job</p>
          </div>
          <CardContent className="mt-4 space-y-4">
            {analytics.jobStats.map(({ job, count, avg, best }) => (
              <div key={job.id}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{job.title}</p>
                    <p className="text-xs text-slate-400">{count} candidates</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-xs text-slate-400">Avg</p>
                      <p className="text-sm font-semibold tabular-nums">{avg}%</p>
                    </div>
                    <ScoreRing score={best} size={40} strokeWidth={4} />
                  </div>
                </div>
                <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${avg}%` }}
                    transition={{ duration: 0.6 }}
                    className={cn("h-full rounded-full", scoreTone(avg) === "high" ? "bg-emerald-500" : scoreTone(avg) === "good" ? "bg-blue-500" : scoreTone(avg) === "fair" ? "bg-amber-500" : "bg-rose-500")}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Screening Timeline */}
      {analytics.timeline.length > 0 && (
        <Card className="mt-6">
          <div className="px-6 pt-5">
            <h2 className="font-semibold">Screening activity</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Screenings per day (last 14 days)</p>
          </div>
          <CardContent className="mt-4">
            <div className="flex items-end gap-1 h-32">
              {analytics.timeline.map(([day, count], i) => {
                const maxTl = Math.max(...analytics.timeline.map(([, c]) => c), 1);
                return (
                  <div key={day} className="flex flex-1 flex-col items-center gap-1">
                    <span className="text-[10px] font-medium tabular-nums text-slate-500">{count}</span>
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${(count / maxTl) * 100}%` }}
                      transition={{ delay: i * 0.04, duration: 0.4 }}
                      className="w-full rounded-t-md bg-brand-400 dark:bg-brand-500 min-h-[4px]"
                    />
                    <span className="text-[9px] text-slate-400 writing-vertical-lr">{day.slice(5)}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  suffix,
  delay,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  suffix?: string;
  delay: number;
}) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let raf: number;
    const t = setTimeout(() => {
      const start = performance.now();
      const dur = 900;
      const tick = (now: number) => {
        const p = Math.min(1, (now - start) / dur);
        setDisplay(Math.round((1 - Math.pow(1 - p, 3)) * value));
        if (p < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    }, 120 + delay * 1000);
    return () => {
      clearTimeout(t);
      cancelAnimationFrame(raf ?? 0);
    };
  }, [value, delay]);

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}>
      <Card className="card-hover p-5">
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-500 dark:text-slate-400">{label}</span>
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-950/60 dark:text-brand-400">
            <Icon className="h-4 w-4" />
          </span>
        </div>
        <p className="mt-2 text-3xl font-bold tabular-nums tracking-tight">
          {display}
          {suffix}
        </p>
      </Card>
    </motion.div>
  );
}
