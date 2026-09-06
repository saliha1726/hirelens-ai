"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { MapPin, Briefcase } from "lucide-react";
import type { Candidate, ScreeningRecord } from "@/lib/types";
import { ScoreRing } from "@/components/ui/score-ring";
import { StatusBadge } from "@/components/candidate/match-views";
import { initialsOf, titleCaseName, timeAgo } from "@/lib/utils";

/** Compact ranked-row used in dashboard/candidate lists. */
export function CandidateRow({
  candidate,
  screening,
  rank,
}: {
  candidate: Candidate;
  screening?: ScreeningRecord;
  rank?: number;
}) {
  const name = candidate.resume.name ?? titleCaseName(candidate.fileName);
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <Link
        href={`/candidates/${candidate.id}`}
        className="focus-ring group block rounded-2xl border border-slate-200/80 bg-white p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-brand-300/70 hover:shadow-lg hover:shadow-brand-600/5 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-brand-500/40 glow-hover"
      >
        <div className="flex items-center gap-4">
          {rank != null && (
            <span className="w-6 shrink-0 text-center text-sm font-semibold tabular-nums text-slate-400">
              {rank}
            </span>
          )}
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500/15 to-violet-500/15 text-sm font-semibold text-brand-700 dark:text-brand-300">
            {initialsOf(name)}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="truncate font-medium group-hover:text-brand-600 dark:group-hover:text-brand-400">{name}</p>
              <StatusBadge status={candidate.status} />
            </div>
            <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-slate-500 dark:text-slate-400">
              {screening && (
                <span className="inline-flex items-center gap-1">
                  <Briefcase className="h-3 w-3" /> {screening.jobTitle}
                </span>
              )}
              {candidate.resume.location && (
                <span className="inline-flex items-center gap-1 truncate">
                  <MapPin className="h-3 w-3" /> {candidate.resume.location}
                </span>
              )}
              {typeof candidate.resume.totalYearsExperience === "number" && (
                <span>≈{candidate.resume.totalYearsExperience} yrs</span>
              )}
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            {screening ? (
              <ScoreRing score={screening.match.overallScore} size={56} strokeWidth={6} />
            ) : (
              <span className="text-xs text-slate-400">not screened</span>
            )}
          </div>
        </div>
        {screening && (
          <div className="mt-2 flex flex-wrap gap-1.5 pl-[4.25rem] max-lg:pl-0">
            {matchChips(screening)}
          </div>
        )}
        <p className="mt-1 text-right text-[11px] text-slate-400">updated {timeAgo(
          candidate.screenings.length > 0
            ? candidate.screenings[candidate.screenings.length - 1].createdAt
            : candidate.createdAt
        )}</p>
      </Link>
    </motion.div>
  );
}

function matchChips(s: ScreeningRecord) {
  return s.match.matchedSkills.slice(0, 4).map((skill) => (
    <span key={skill} className="rounded-md bg-emerald-50 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
      ✓ {skill}
    </span>
  )).concat(
    s.match.missingSkills.slice(0, 2).map((skill) => (
      <span key={skill} className="rounded-md bg-rose-50 px-1.5 py-0.5 text-[10px] font-medium text-rose-600 dark:bg-rose-950/50 dark:text-rose-300">
        ✕ {skill}
      </span>
    )),
  );
}
