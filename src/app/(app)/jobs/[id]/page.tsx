"use client";

import { use, useMemo } from "react";
import Link from "next/link";
import { ArrowLeft, Briefcase, GraduationCap, Award, Gauge } from "lucide-react";
import { useWorkspace } from "@/lib/client/store";
import { Badge, ButtonLink, Card, CardContent, EmptyState } from "@/components/ui/primitives";
import { ScoreRing } from "@/components/ui/score-ring";

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

  if (!job) {
    return (
      <div className="mx-auto max-w-3xl">
        <EmptyState
          title="Job not found"
          description="This job may have been deleted or belongs to another browser workspace."
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
        <ButtonLink href="/screen">Screen candidates for this job</ButtonLink>
      </div>

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
