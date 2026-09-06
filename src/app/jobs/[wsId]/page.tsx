"use client";

import { useState, useEffect, use } from "react";
import { motion } from "framer-motion";
import { Briefcase, Clock, GraduationCap, ArrowRight, Loader2 } from "lucide-react";
import Link from "next/link";
import { Logo } from "@/components/layout/app-shell";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import type { JobRequirements } from "@/lib/types";

interface PageProps {
  params: Promise<{ wsId: string }>;
}

function SeniorityBadge({ level }: { level?: string }) {
  if (!level) return null;
  const colors: Record<string, string> = {
    junior: "bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300",
    mid: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300",
    senior: "bg-violet-50 text-violet-700 dark:bg-violet-950/50 dark:text-violet-300",
    lead: "bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300",
    principal: "bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300",
  };
  return (
    <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium capitalize ${colors[level] ?? "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"}`}>
      {level}
    </span>
  );
}

export default function JobsListingPage({ params }: PageProps) {
  const { wsId } = use(params);
  const [jobs, setJobs] = useState<JobRequirements[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadJobs() {
      try {
        const res = await fetch(`/api/public-jobs?wsId=${wsId}`);
        if (res.ok) {
          const data = await res.json();
          setJobs(data.jobs ?? []);
        }
      } catch {}
      setLoading(false);
    }
    loadJobs();
  }, [wsId]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-brand-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-brand-950/20">
      <header className="glass sticky top-0 z-50 border-b border-slate-200/60 dark:border-slate-800/60">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Logo />
          <ThemeToggle />
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-4 py-16 text-center sm:px-6">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700 dark:border-brand-500/30 dark:bg-brand-950/50 dark:text-brand-300">
            <Briefcase className="h-3 w-3" /> {jobs.length} open position{jobs.length !== 1 ? "s" : ""}
          </span>
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
          className="mx-auto mt-6 max-w-3xl text-balance text-3xl font-bold tracking-tight sm:text-5xl"
        >
          Join our <span className="text-gradient-animated">growing team</span>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }}
          className="mx-auto mt-4 max-w-xl text-balance text-slate-600 dark:text-slate-300"
        >
          We&apos;re looking for talented people to help us build the future. Browse our open positions below.
        </motion.p>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
          </div>
        ) : jobs.length === 0 ? (
          <div className="py-16 text-center">
            <Briefcase className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-600" />
            <p className="mt-4 text-lg font-medium text-slate-500 dark:text-slate-400">No open positions yet</p>
            <p className="mt-1 text-sm text-slate-400 dark:text-slate-500">Check back soon.</p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {jobs.map((job, i) => (
              <motion.div key={job.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <div className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-5 transition-all hover:shadow-lg hover:shadow-brand-500/5 dark:border-slate-800 dark:bg-slate-900">
                  <div className="flex items-start justify-between">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500/15 to-violet-500/15 text-brand-600 dark:text-brand-400">
                      <Briefcase className="h-5 w-5" />
                    </span>
                    <SeniorityBadge level={job.seniorityTarget} />
                  </div>
                  <h3 className="mt-3 text-lg font-semibold leading-snug">{job.title}</h3>
                  {job.company && <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">{job.company}</p>}
                  <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-500 dark:text-slate-400">
                    {job.minYearsExperience != null && (
                      <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {job.minYearsExperience}+ years</span>
                    )}
                    {job.educationRequirement && (
                      <span className="flex items-center gap-1 capitalize"><GraduationCap className="h-3.5 w-3.5" /> {job.educationRequirement.level.replace("-", " ")}</span>
                    )}
                  </div>
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
                  <div className="mt-auto pt-4">
                    <Link href={`/jobs/${wsId}/${job.id}/apply`}
                      className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-medium text-white shadow-md shadow-brand-600/25 transition-all hover:bg-brand-700">
                      Apply now <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </section>

      <footer className="border-t border-slate-200 py-8 dark:border-slate-800">
        <div className="mx-auto max-w-6xl px-4 text-center text-xs text-slate-400 sm:px-6">
          Powered by <strong>HireLens AI</strong> · AI-powered resume screening
        </div>
      </footer>
    </div>
  );
}
