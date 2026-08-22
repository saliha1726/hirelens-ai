"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Users, Briefcase, Gauge, Activity, ArrowRight, ScanSearch } from "lucide-react";
import { useWorkspace } from "@/lib/client/store";
import { Card, CardContent, ButtonLink, EmptyState, Skeleton } from "@/components/ui/primitives";
import { ScoreRing } from "@/components/ui/score-ring";
import { CandidateRow } from "@/components/candidate/candidate-card";
import { DemoDataManager } from "@/components/workspace/demo-banner";
import { timeAgo } from "@/lib/utils";

export default function DashboardPage() {
  const ws = useWorkspace();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const stats = useMemo(() => {
    const allScores = ws.candidates.flatMap((c) => c.screenings.map((s) => s.match.overallScore));
    const avg = allScores.length ? Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length) : 0;

    // Best screening per candidate, ranked.
    const top = ws.candidates
      .map((c) => ({ c, best: c.screenings.reduce<null | (typeof c.screenings)[number]>((acc, s) => (!acc || s.match.overallScore > acc.match.overallScore ? s : acc), null) }))
      .filter((x) => x.best)
      .sort((a, b) => b.best!.match.overallScore - a.best!.match.overallScore)
      .slice(0, 5);

    const shortlisted = ws.candidates.filter((c) => c.status === "shortlisted" || c.status === "interview").length;
    return { candidates: ws.candidates.length, jobs: ws.jobs.length, avg, top, shortlisted, activity: ws.activity.slice(0, 7) };
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

  const empty = stats.candidates === 0;

  return (
    <div className="mx-auto max-w-6xl">
      <DemoDataManager />
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Dashboard</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Your screening workspace at a glance.
          </p>
        </div>
        <ButtonLink href="/screen">
          <ScanSearch className="h-4 w-4" /> New screening
        </ButtonLink>
      </div>

      {empty ? (
        <EmptyState
          icon={<Users className="h-6 w-6" />}
          title="No candidates yet"
          description="Run your first screening or load the demo data to explore HireLens with sample candidates."
          action={
            <div className="flex gap-2">
              <ButtonLink href="/screen">Run a screening</ButtonLink>
            </div>
          }
        />
      ) : (
        <>
          {/* Stat cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard icon={Users} label="Total candidates" value={stats.candidates} delay={0} />
            <StatCard icon={Briefcase} label="Jobs analyzed" value={stats.jobs} delay={0.06} />
            <StatCard icon={Gauge} label="Average match" value={stats.avg} suffix="%" delay={0.12} />
            <StatCard icon={Activity} label="In pipeline" value={stats.shortlisted} hint="shortlisted / interview" delay={0.18} />
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-3">
            {/* Top candidates */}
            <Card className="lg:col-span-2">
              <div className="flex items-center justify-between px-6 pt-5">
                <h2 className="font-semibold">Top candidates</h2>
                <Link href="/candidates" className="text-sm font-medium text-brand-600 hover:underline dark:text-brand-400">
                  View all <ArrowRight className="inline h-3.5 w-3.5" />
                </Link>
              </div>
              <CardContent className="mt-3 space-y-3">
                {stats.top.map(({ c, best }, i) => (
                  <CandidateRow key={c.id} candidate={c} screening={best ?? undefined} rank={i + 1} />
                ))}
              </CardContent>
            </Card>

            {/* Recent activity */}
            <Card>
              <div className="px-6 pt-5">
                <h2 className="font-semibold">Recent activity</h2>
              </div>
              <CardContent className="mt-3">
                <ol className="relative space-y-4 border-l border-slate-200 pl-4 dark:border-slate-800">
                  {stats.activity.map((a, i) => (
                    <motion.li
                      key={a.id}
                      initial={{ opacity: 0, x: -6 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="text-sm"
                    >
                      <span className="absolute -left-[5px] mt-1.5 h-2 w-2 rounded-full bg-brand-500" />
                      <p className="leading-snug text-slate-700 dark:text-slate-200">{a.message}</p>
                      <p className="text-xs text-slate-400">{timeAgo(a.at)}</p>
                    </motion.li>
                  ))}
                </ol>
              </CardContent>
            </Card>
          </div>

          {/* Job ranking table */}
          {ws.jobs.length > 0 && (
            <Card className="mt-6 overflow-hidden">
              <div className="px-6 pt-5">
                <h2 className="font-semibold">Jobs & candidate rankings</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">Best-scoring candidate per job.</p>
              </div>
              <CardContent className="mt-2 overflow-x-auto pb-5">
                <table className="w-full min-w-[560px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400 dark:border-slate-800">
                      <th className="pb-2 font-medium">Job</th>
                      <th className="pb-2 font-medium">Required skills</th>
                      <th className="pb-2 font-medium">Min. yrs</th>
                      <th className="pb-2 text-right font-medium">Screened</th>
                      <th className="pb-2 text-right font-medium">Best score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ws.jobs.map((job) => {
                      const scored = ws.candidates
                        .map((c) => ({ c, s: c.screenings.find((x) => x.jobId === job.id) }))
                        .filter((x) => x.s)
                        .sort((a, b) => b.s!.match.overallScore - a.s!.match.overallScore);
                      return (
                        <tr key={job.id} className="border-b border-slate-50 last:border-0 dark:border-slate-800/50">
                          <td className="py-3 pr-4">
                            <p className="font-medium">{job.title}</p>
                            {job.company && <p className="text-xs text-slate-400">{job.company}</p>}
                          </td>
                          <td className="py-3 pr-4 text-xs text-slate-500 dark:text-slate-400">
                            {job.requiredSkills.slice(0, 3).map((s) => s.name).join(", ") || "—"}
                            {job.requiredSkills.length > 3 && ` +${job.requiredSkills.length - 3}`}
                          </td>
                          <td className="py-3 pr-4 tabular-nums text-slate-500 dark:text-slate-400">{job.minYearsExperience ?? "—"}</td>
                          <td className="py-3 pr-4 text-right tabular-nums text-slate-500 dark:text-slate-400">{scored.length}</td>
                          <td className="py-3 text-right">
                            {scored[0] ? (
                              <Link href={`/candidates/${scored[0].c.id}`} className="inline-flex items-center gap-2 font-medium hover:text-brand-600">
                                <ScoreRing score={scored[0].s!.match.overallScore} size={38} strokeWidth={5} />
                                <span className="hidden sm:inline">{scored[0].c.resume.name ?? "Candidate"}</span>
                              </Link>
                            ) : (
                              <span className="text-xs text-slate-400">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  suffix,
  hint,
  delay,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  suffix?: string;
  hint?: string;
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
        {hint && <p className="text-xs text-slate-400">{hint}</p>}
      </Card>
    </motion.div>
  );
}
