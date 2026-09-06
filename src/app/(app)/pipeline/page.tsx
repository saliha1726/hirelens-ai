"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { GripVertical, Link as LinkIcon } from "lucide-react";
import { useWorkspace, setStatus } from "@/lib/client/store";
import { Card, EmptyState } from "@/components/ui/primitives";
import { ScoreRing } from "@/components/ui/score-ring";
import { StatusBadge } from "@/components/candidate/match-views";
import { initialsOf, titleCaseName } from "@/lib/utils";
import type { Candidate, ScreeningStatus } from "@/lib/types";
import Link from "next/link";

const COLUMNS: { status: ScreeningStatus; label: string; color: string; dot: string }[] = [
  { status: "new", label: "New", color: "border-slate-300 bg-slate-50 dark:border-slate-700 dark:bg-slate-900/50", dot: "bg-slate-400" },
  { status: "screening", label: "Screening", color: "border-blue-300 bg-blue-50/50 dark:border-blue-700 dark:bg-blue-950/30", dot: "bg-blue-500" },
  { status: "shortlisted", label: "Shortlisted", color: "border-emerald-300 bg-emerald-50/50 dark:border-emerald-700 dark:bg-emerald-950/30", dot: "bg-emerald-500" },
  { status: "interview", label: "Interview", color: "border-violet-300 bg-violet-50/50 dark:border-violet-700 dark:bg-violet-950/30", dot: "bg-violet-500" },
  { status: "hired", label: "Hired", color: "border-green-300 bg-green-50/50 dark:border-green-700 dark:bg-green-950/30", dot: "bg-green-500" },
  { status: "rejected", label: "Rejected", color: "border-rose-300 bg-rose-50/50 dark:border-rose-700 dark:bg-rose-950/30", dot: "bg-rose-500" },
];

export default function PipelinePage() {
  const ws = useWorkspace();
  const [mounted, setMounted] = useState(false);
  const [dragOverCol, setDragOverCol] = useState<ScreeningStatus | null>(null);
  useEffect(() => setMounted(true), []);

  const grouped: Record<ScreeningStatus, Candidate[]> = {
    new: [], screening: [], shortlisted: [], interview: [], hired: [], rejected: [],
  };
  for (const c of ws.candidates) {
    grouped[c.status].push(c);
  }

  const handleDragStart = useCallback((e: React.DragEvent, candidateId: string) => {
    e.dataTransfer.setData("text/plain", candidateId);
    e.dataTransfer.effectAllowed = "move";
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, targetStatus: ScreeningStatus) => {
    e.preventDefault();
    setDragOverCol(null);
    const candidateId = e.dataTransfer.getData("text/plain");
    if (!candidateId) return;
    const candidate = ws.candidates.find((c) => c.id === candidateId);
    if (candidate && candidate.status !== targetStatus) {
      setStatus(candidateId, targetStatus);
    }
  }, [ws.candidates]);

  const handleDragOver = useCallback((e: React.DragEvent, status: ScreeningStatus) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverCol(status);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOverCol(null);
  }, []);

  if (!mounted) {
    return (
      <div className="mx-auto max-w-7xl">
        <div className="mb-6">
          <div className="h-9 w-48 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-800" />
          <div className="mt-2 h-4 w-72 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
        </div>
        <div className="grid grid-cols-6 gap-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-96 animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-900" />
          ))}
        </div>
      </div>
    );
  }

  if (ws.candidates.length === 0) {
    return (
      <div className="mx-auto max-w-6xl">
        <EmptyState
          icon={<GripVertical className="h-6 w-6" />}
          title="No candidates yet"
          description="Run a screening to populate the pipeline with candidates you can drag between stages."
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1600px]">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Pipeline</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Drag candidates between stages to update their status. {ws.candidates.length} total candidates.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {COLUMNS.map((col) => (
          <div
            key={col.status}
            onDragOver={(e) => handleDragOver(e, col.status)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, col.status)}
            className={`flex flex-col rounded-2xl border-2 border-dashed p-3 transition-colors min-h-[200px] ${
              dragOverCol === col.status
                ? "border-brand-400 bg-brand-50/50 dark:border-brand-500 dark:bg-brand-950/20"
                : col.color
            }`}
          >
            <div className="mb-3 flex items-center gap-2 px-1">
              <span className={`h-2.5 w-2.5 rounded-full ${col.dot}`} />
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                {col.label}
              </h3>
              <span className="ml-auto text-xs font-medium tabular-nums text-slate-400">
                {grouped[col.status].length}
              </span>
            </div>

            <div className="flex flex-1 flex-col gap-2">
              {grouped[col.status].map((candidate) => (
                <PipelineCard
                  key={candidate.id}
                  candidate={candidate}
                  onDragStart={handleDragStart}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PipelineCard({
  candidate,
  onDragStart,
}: {
  candidate: Candidate;
  onDragStart: (e: React.DragEvent, id: string) => void;
}) {
  const name = candidate.resume.name ?? titleCaseName(candidate.fileName);
  const bestScreening = candidate.screenings.reduce<null | (typeof candidate.screenings)[number]>((acc, s) =>
    !acc || s.match.overallScore > acc.match.overallScore ? s : acc, null);
  const bestScore = bestScreening?.match.overallScore ?? 0;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      draggable
      onDragStart={(e) => onDragStart(e as unknown as React.DragEvent, candidate.id)}
      className="group cursor-grab rounded-xl border border-slate-200 bg-white p-3 shadow-sm transition-all hover:shadow-md hover:border-brand-300 active:cursor-grabbing dark:border-slate-700 dark:bg-slate-800 dark:hover:border-brand-500"
    >
      <div className="flex items-start gap-2.5">
        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500/15 to-violet-500/15 text-[10px] font-bold text-brand-700 dark:text-brand-300">
          {initialsOf(name)}
        </span>
        <div className="min-w-0 flex-1">
          <Link href={`/candidates/${candidate.id}`} className="block truncate text-sm font-medium hover:text-brand-600 dark:hover:text-brand-400">
            {name}
          </Link>
          {bestScreening && (
            <p className="mt-0.5 truncate text-[11px] text-slate-400">
              {bestScreening.jobTitle}
            </p>
          )}
        </div>
        <ScoreRing score={bestScore} size={36} strokeWidth={4} />
      </div>
    </motion.div>
  );
}
