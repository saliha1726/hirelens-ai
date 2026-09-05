"use client";

import { use, useMemo } from "react";
import Link from "next/link";
import { ArrowLeft, Briefcase, GraduationCap, Award, Gauge, Download, Users, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";
import { useWorkspace } from "@/lib/client/store";
import { Badge, Button, ButtonLink, Card, CardContent, EmptyState } from "@/components/ui/primitives";
import { ScoreRing } from "@/components/ui/score-ring";
import { exportCandidatesToCSV } from "@/lib/export-csv";
import { cn, scoreTone } from "@/lib/utils";
import type { ScreeningStatus } from "@/lib/types";

const STATUS_COLORS: Record<ScreeningStatus, string> = {
  new: "bg-slate-400",
  screening: "bg-blue-500",
  shortlisted: "bg-emerald-500",
  interview: "bg-violet-500",
  hired: "bg-green-500",
  rejected: "bg-rose-500",
};

export default function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const ws = useWorkspace();
  const job = ws.jobs.find((j) => j.id === id);

  const ranked = useMemo(() => {
    if (!job) return [];
    return ws.candidates
      .map((c) => ({ candidate: c, screening: c.screenings.find((s) => s.jobId === job.id) }))
      .filter((x) => x.screening)
      .sort((a, b) => b.screening!.match.overallScore - a.screening!.match.overallScore);
  }, [job, ws.candidates]);

  const stats = useMemo(() => {
    if (!ranked.length) return null;
    const scores = ranked.map((r) => r.screening!.match.overallScore);
    const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
    const best = Math.max(...scores);
    const worst = Math.min(...scores);
    const high = scores.filter((s) => s >= 80).length;

    const buckets = [0, 0, 0, 0, 0];
    for (const s of scores) buckets[Math.min(4, Math.floor(s / 20))]++;

    const pipeline: Record<string, number> = {};
    for (const { candidate } of ranked) {
      pipeline[candidate.status] = (pipeline[candidate.status] || 0) + 1;
    }

    return { avg, best, worst, high, total: ranked.length, buckets, pipeline };
  }, [ranked]);

  if (!job) {
    return (
      <div className="mx-auto max-w-3xl">
        <EmptyState
          title="Job not found"
          description="This job may have been deleted or belongs to another workspace."
          action={<ButtonLink href="/jobs">Back to jobs</ButtonLink>}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl">
      <Link href="/jobs" className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-brand-600 dark:text-slate-400">
        <ArrowLeft className="h-4 w-4" /> All jobs
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{job.title}</h1>
          {job.company && <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">{job.company}</p>}
        </div>
        <div className="flex gap-2">
          {ranked.length > 0 && (
            <Button variant="outline" size="sm" onClick={() => exportCandidatesToCSV(ranked.map((r) => r.candidate))}>
              <Download className="h-4 w-4" /> Export CSV
            </Button>
          )}
          <ButtonLink href="/screen">Screen candidates for this job</ButtonLink>
        </div>
      </div>

      {/* Job stats */}
      {stats && (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard icon={Users} label="Screened" value={stats.total} />
          <StatCard icon={TrendingUp} label="Avg score" value={stats.avg} suffix="%" />
          <StatCard icon={Award} label="Best match" value={stats.best} suffix="%" />
          <StatCard icon={Gauge} label="High matches (80+)" value={stats.high} />
        </div>
      )}

      {/* Score distribution for this job */}
      {stats && (
        <Card className="mt-6">
          <CardContent className="pt-5">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-400">Score distribution</h2>
            <div className="flex items-end gap-3 h-32">
              {stats.buckets.map((count, i) => {
                const maxB = Math.max(...stats.buckets, 1);
                return (
                  <div key={i} className="flex flex-1 flex-col items-center gap-1">
                    <span className="text-xs font-medium tabular-nums text-slate-500">{count}</span>
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${(count / maxB) * 100}%` }}
                      transition={{ delay: i * 0.08, duration: 0.5 }}
                      className={cn(
                        "w-full rounded-t-lg min-h-[4px]",
                        i <= 1 ? "bg-rose-400" : i === 2 ? "bg-amber-400" : i === 3 ? "bg-emerald-400" : "bg-green-500",
                      )}
                    />
                    <span className="text-[10px] text-slate-400">{i * 20}-{(i + 1) * 20}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pipeline for this job */}
      {stats && Object.keys(stats.pipeline).length > 0 && (
        <Card className="mt-6">
          <CardContent className="pt-5">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-400">Pipeline breakdown</h2>
            <div className="flex flex-wrap gap-4">
              {Object.entries(stats.pipeline).map(([status, count]) => (
                <div key={status} className="flex items-center gap-2">
                  <span className={cn("h-2.5 w-2.5 rounded-full", STATUS_COLORS[status as ScreeningStatus])} />
                  <span className="text-sm font-medium capitalize">{status}</span>
                  <span className="text-sm tabular-nums text-slate-400">{count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Extracted requirements */}
      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <Card>
          <CardContent className="pt-5">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold">
              <Briefcase className="h-4 w-4 text-brand-500" /> Required skills ({job.requiredSkills.length})
            </h2>
            <div className="flex flex-wrap gap-1.5">
              {job.requiredSkills.length ? (
                job.requiredSkills.map((s) => (
                  <Badge key={s.name} tone="brand">{s.name}</Badge>
                ))
              ) : (
                <p className="text-sm text-slate-400">None detected in the description.</p>
              )}
            </div>

            <h2 className="mb-3 mt-6 text-sm font-semibold text-slate-500 dark:text-slate-300">
              Preferred / nice-to-have ({job.preferredSkills.length})
            </h2>
            <div className="flex flex-wrap gap-1.5">
              {job.preferredSkills.length ? (
                job.preferredSkills.map((s) => (
                  <Badge key={s.name}>{s.name}</Badge>
                ))
              ) : (
                <p className="text-sm text-slate-400">None listed.</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-4 pt-5">
            <div className="grid grid-cols-2 gap-3">
              <Requirement icon={Gauge} label="Min. experience" value={job.minYearsExperience != null ? `${job.minYearsExperience}+ yrs` : "Not specified"} />
              <Requirement icon={Briefcase} label="Seniority target" value={job.seniorityTarget ?? "Not specified"} />
              <Requirement icon={GraduationCap} label="Education" value={
                job.educationRequirement
                  ? `${job.educationRequirement.level}${job.educationRequirement.field ? ` · ${job.educationRequirement.field}` : ""}${job.educationRequirement.strict ? " (strict)" : ""}`
                  : "Not specified"
              } />
              <Requirement icon={Award} label="Certifications" value={job.certificationRequirements.join(", ") || "None required"} />
            </div>

            {job.keywords.length > 0 && (
              <div>
                <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-slate-400">Key themes</p>
                <div className="flex flex-wrap gap-1.5">
                  {job.keywords.slice(0, 12).map((k) => (
                    <span key={k} className="rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300">{k}</span>
                  ))}
                </div>
              </div>
            )}

            {!!job.responsibilities?.length && (
              <div>
                <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-slate-400">Responsibilities detected</p>
                <ul className="space-y-1">
                  {job.responsibilities.slice(0, 5).map((r, i) => (
                    <li key={i} className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">• {r}</li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Ranking */}
      <Card className="mt-6">
        <CardContent className="pt-5">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-400">
            Candidate ranking for this job ({ranked.length})
          </h2>
          {ranked.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">No candidates screened against this job yet.</p>
          ) : (
            <ol className="divide-y divide-slate-100 dark:divide-slate-800">
              {ranked.map(({ candidate, screening }, i) => (
                <li key={candidate.id}>
                  <Link
                    href={`/candidates/${candidate.id}`}
                    className="focus-ring flex items-center gap-4 py-3 transition-colors hover:bg-slate-50/60 dark:hover:bg-slate-800/40"
                  >
                    <span className="w-6 text-center text-sm font-semibold tabular-nums text-slate-400">{i + 1}</span>
                    <ScoreRing score={screening!.match.overallScore} size={48} strokeWidth={6} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{candidate.resume.name ?? candidate.fileName}</p>
                      <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                        ✓ {screening!.match.matchedSkills.slice(0, 4).join(", ") || "—"}
                      </p>
                    </div>
                    <div className="hidden max-w-[240px] flex-wrap justify-end gap-1 sm:flex">
                      {screening!.match.missingSkills.slice(0, 3).map((s) => (
                        <span key={s} className="rounded bg-rose-50 px-1.5 py-0.5 text-[10px] font-medium text-rose-600 dark:bg-rose-950/50 dark:text-rose-300">✕ {s}</span>
                      ))}
                    </div>
                  </Link>
                </li>
              ))}
            </ol>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Requirement({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 p-3 dark:border-slate-800">
      <p className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-slate-400">
        <Icon className="h-3.5 w-3.5" /> {label}
      </p>
      <p className="mt-1 text-sm font-semibold capitalize leading-snug">{value}</p>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, suffix }: { icon: React.ComponentType<{ className?: string }>; label: string; value: number; suffix?: string }) {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <span className="text-sm text-slate-500 dark:text-slate-400">{label}</span>
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-950/60 dark:text-brand-400">
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <p className="mt-2 text-2xl font-bold tabular-nums tracking-tight">
        {value}{suffix}
      </p>
    </Card>
  );
}
