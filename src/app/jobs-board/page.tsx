"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { Briefcase, MapPin, Clock, GraduationCap, Star, ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";
import { useWorkspace } from "@/lib/client/store";
import { Card, CardContent } from "@/components/ui/primitives";
import { Logo } from "@/components/layout/app-shell";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import type { JobRequirements } from "@/lib/types";

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

function JobCard({ job }: { job: JobRequirements }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card className="card-hover glow-hover group h-full">
        <CardContent className="pt-5">
          <div className="flex items-start justify-between">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500/15 to-violet-500/15 text-brand-600 dark:text-brand-400">
              <Briefcase className="h-5 w-5" />
            </span>
            <SeniorityBadge level={job.seniorityTarget} />
          </div>
          <h3 className="mt-3 text-lg font-semibold leading-snug">{job.title}</h3>
          {job.company && (
            <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">{job.company}</p>
          )}

          <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-500 dark:text-slate-400">
            {job.minYearsExperience != null && (
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" /> {job.minYearsExperience}+ years
              </span>
            )}
            {job.educationRequirement && (
              <span className="flex items-center gap-1 capitalize">
                <GraduationCap className="h-3.5 w-3.5" /> {job.educationRequirement.level.replace("-", " ")}{job.educationRequirement.field ? ` in ${job.educationRequirement.field}` : ""}
              </span>
            )}
          </div>

          <div className="mt-3 flex flex-wrap gap-1.5">
            {job.requiredSkills.slice(0, 5).map((s) => (
              <span key={s.name} className="rounded-md bg-brand-50 px-2 py-0.5 text-[11px] font-medium text-brand-700 dark:bg-brand-950/60 dark:text-brand-300">
                {s.name}
              </span>
            ))}
            {job.requiredSkills.length > 5 && (
              <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500 dark:bg-slate-800">
                +{job.requiredSkills.length - 5} more
              </span>
            )}
          </div>

          {job.responsibilities && job.responsibilities.length > 0 && (
            <p className="mt-3 line-clamp-2 text-xs text-slate-500 dark:text-slate-400">
              {job.responsibilities[0]}
            </p>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function JobBoardPage() {
  const ws = useWorkspace();

  return (
    <div className="min-h-screen">
      <header className="glass sticky top-0 z-50 border-b border-slate-200/60 dark:border-slate-800/60">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Logo />
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link
              href="/screen"
              className="inline-flex items-center gap-1.5 rounded-xl bg-brand-600 px-4 py-2 text-sm font-medium text-white shadow-md shadow-brand-600/25 transition-all hover:bg-brand-700 hover:shadow-lg"
            >
              Apply now <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-4 py-16 text-center sm:px-6">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700 dark:border-brand-500/30 dark:bg-brand-950/50 dark:text-brand-300">
            <Sparkles className="h-3 w-3" /> {ws.jobs.length} open position{ws.jobs.length !== 1 ? "s" : ""}
          </span>
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="mx-auto mt-6 max-w-3xl text-balance text-3xl font-bold tracking-tight sm:text-5xl"
        >
          Join our <span className="text-gradient-animated">growing team</span>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.16 }}
          className="mx-auto mt-4 max-w-xl text-balance text-slate-600 dark:text-slate-300"
        >
          We're looking for talented people to help us build the future of hiring.
          Browse our open positions below.
        </motion.p>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
        {ws.jobs.length === 0 ? (
          <div className="py-16 text-center">
            <Briefcase className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-600" />
            <p className="mt-4 text-lg font-medium text-slate-500 dark:text-slate-400">
              No open positions yet
            </p>
            <p className="mt-1 text-sm text-slate-400 dark:text-slate-500">
              Check back soon — we're always growing.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {ws.jobs.map((job) => (
              <JobCard key={job.id} job={job} />
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
