"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Briefcase, Plus, Trash2, FileText } from "lucide-react";
import { useWorkspace, deleteJob } from "@/lib/client/store";
import { ButtonLink, Card, CardContent, EmptyState } from "@/components/ui/primitives";
import { DemoDataManager } from "@/components/workspace/demo-banner";

export default function JobsPage() {
  const ws = useWorkspace();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <div className="mx-auto max-w-6xl space-y-4">
        <div className="h-9 w-64 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-800" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-40 animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-900" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl">
      <DemoDataManager />
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Jobs</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Saved job requirements extracted by HireLens.
          </p>
        </div>
        <ButtonLink href="/screen">
          <Plus className="h-4 w-4" /> Add via screening
        </ButtonLink>
      </div>

      {ws.jobs.length === 0 ? (
        <EmptyState
          icon={<Briefcase className="h-6 w-6" />}
          title="No saved jobs yet"
          description="Paste a job description in the screening flow — HireLens extracts the requirements and saves the job to your workspace."
          action={<ButtonLink href="/screen">Create your first job</ButtonLink>}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {ws.jobs.map((job, i) => {
            const screened = ws.candidates.filter((c) => c.screenings.some((s) => s.jobId === job.id)).length;
            return (
              <motion.div key={job.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <Card className="card-hover group relative h-full">
                  <CardContent className="pt-5">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (window.confirm(`Delete "${job.title}"? This cannot be undone.`)) {
                          deleteJob(job.id);
                        }
                      }}
                      aria-label={`Delete ${job.title}`}
                      className="absolute right-4 top-4 rounded-lg p-1.5 text-slate-300 opacity-0 transition-all hover:bg-rose-50 hover:text-rose-500 focus:opacity-100 group-hover:opacity-100 dark:hover:bg-rose-950/40"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                    <span className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500/15 to-violet-500/15 text-brand-600 dark:text-brand-400">
                      <Briefcase className="h-5 w-5" />
                    </span>
                    <h2 className="pr-8 font-semibold leading-snug">{job.title}</h2>
                    {job.company && <p className="text-xs text-slate-400">{job.company}</p>}

                    <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                      <dt>Required skills</dt><dd className="text-right font-medium text-slate-700 dark:text-slate-200">{job.requiredSkills.length}</dd>
                      <dt>Preferred skills</dt><dd className="text-right font-medium text-slate-700 dark:text-slate-200">{job.preferredSkills.length}</dd>
                      <dt>Min. experience</dt><dd className="text-right font-medium text-slate-700 dark:text-slate-200">{job.minYearsExperience != null ? `${job.minYearsExperience} yrs` : "—"}</dd>
                      <dt>Candidates screened</dt><dd className="text-right font-medium text-slate-700 dark:text-slate-200">{screened}</dd>
                    </dl>

                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {job.requiredSkills.slice(0, 4).map((s) => (
                        <span key={s.name} className="rounded-md bg-brand-50 px-2 py-0.5 text-[11px] font-medium text-brand-700 dark:bg-brand-950/60 dark:text-brand-300">
                          {s.name}
                        </span>
                      ))}
                      {job.requiredSkills.length > 4 && (
                        <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500 dark:bg-slate-800">
                          +{job.requiredSkills.length - 4} more
                        </span>
                      )}
                    </div>

                    <Link
                      href={`/jobs/${job.id}`}
                      className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-brand-600 hover:underline dark:text-brand-400"
                    >
                      View requirements <FileText className="h-3.5 w-3.5" />
                    </Link>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
