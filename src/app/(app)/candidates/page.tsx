"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { Search, Users, GitCompareArrows, Download, Trash2, ArrowRight } from "lucide-react";
import type { ScreeningStatus, CandidateTag } from "@/lib/types";
import { useWorkspace, bulkUpdateStatus, bulkAddTag, bulkDelete } from "@/lib/client/store";
import { useRole } from "@/lib/hooks/use-role";
import { ALL_STATUSES } from "@/lib/client/store";
import { Button, ButtonLink, Card, EmptyState } from "@/components/ui/primitives";
import { CandidateRow } from "@/components/candidate/candidate-card";
import { DemoDataManager } from "@/components/workspace/demo-banner";
import { cn } from "@/lib/utils";
import { exportCandidatesToCSV } from "@/lib/export-csv";
import { StaggerContainer, StaggerItem } from "@/components/ui/animations";

type SortKey = "score" | "name" | "recent" | "experience";

export default function CandidatesPage() {
  const ws = useWorkspace();
  const { isViewer } = useRole();
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<ScreeningStatus | "all">("all");
  const [jobFilter, setJobFilter] = useState<string>("all");
  const [sort, setSort] = useState<SortKey>("score");
  const [selected, setSelected] = useState<string[]>([]);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return ws.candidates
      .map((c) => ({
        candidate: c,
        best: c.screenings.reduce<null | (typeof c.screenings)[number]>(
          (acc, s) => (!acc || s.match.overallScore > acc.match.overallScore ? s : acc),
          null,
        ),
        jobMatch:
          jobFilter !== "all"
            ? c.screenings.find((s) => s.jobId === jobFilter) ?? null
            : null,
      }))
      .filter(({ candidate, jobMatch }) => {
        if (statusFilter !== "all" && candidate.status !== statusFilter) return false;
        if (jobFilter !== "all" && !jobMatch) return false;
        if (!q) return true;
        const hay = [
          candidate.resume.name,
          candidate.fileName,
          candidate.resume.email,
          ...candidate.resume.skills.map((s) => s.name),
          ...(candidate.resume.domains ?? []),
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return hay.includes(q);
      })
      .sort((a, b) => {
        switch (sort) {
          case "score":
            return (b.jobMatch?.match.overallScore ?? b.best?.match.overallScore ?? -1) - (a.jobMatch?.match.overallScore ?? a.best?.match.overallScore ?? -1);
          case "experience":
            return (b.candidate.resume.totalYearsExperience ?? 0) - (a.candidate.resume.totalYearsExperience ?? 0);
          case "name":
            return (a.candidate.resume.name ?? a.candidate.fileName ?? "").localeCompare(
              b.candidate.resume.name ?? b.candidate.fileName ?? "",
            );
          default:
            return new Date(b.candidate.createdAt).getTime() - new Date(a.candidate.createdAt).getTime();
        }
      });
  }, [ws.candidates, query, statusFilter, jobFilter, sort]);

  function toggleSelect(id: string) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id].slice(-2)));
  }

  if (!mounted) {
    return (
      <div className="mx-auto max-w-6xl space-y-4">
        <div className="h-9 w-64 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-800" />
        <div className="h-12 w-full animate-pulse rounded-xl bg-slate-100 dark:bg-slate-900" />
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-900" />
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
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Candidates</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {ws.candidates.length} in your workspace · search, filter and rank.
          </p>
        </div>
        {selected.length === 2 && !isViewer && (
          <ButtonLink href={`/compare?a=${selected[0]}&b=${selected[1]}`}>
            <GitCompareArrows className="h-4 w-4" /> Compare ({selected.length})
          </ButtonLink>
        )}
        {ws.candidates.length > 0 && (
          <Button variant="outline" size="sm" onClick={() => exportCandidatesToCSV(ws.candidates)}>
            <Download className="h-4 w-4" /> Export CSV
          </Button>
        )}
      </div>

      {/* Controls */}
      <Card className="mb-5 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name, skill, domain…"
              aria-label="Search candidates"
              className="focus-ring w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm dark:border-slate-700 dark:bg-slate-900"
            />
          </div>
          <select
            value={jobFilter}
            onChange={(e) => setJobFilter(e.target.value)}
            aria-label="Filter by job"
            className="focus-ring rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-900"
          >
            <option value="all">All jobs</option>
            {ws.jobs.map((j) => (
              <option key={j.id} value={j.id}>{j.title}</option>
            ))}
          </select>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            aria-label="Sort"
            className="focus-ring rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-900"
          >
            <option value="score">Sort: Match score</option>
            <option value="experience">Sort: Experience</option>
            <option value="recent">Sort: Recently added</option>
            <option value="name">Sort: Name</option>
          </select>
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5" role="group" aria-label="Filter by status">
          {(["all", ...ALL_STATUSES] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={cn(
                "focus-ring rounded-full px-3 py-1 text-xs font-medium capitalize transition-colors",
                statusFilter === s
                  ? "bg-brand-600 text-white shadow-sm shadow-brand-600/25"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700",
              )}
            >
              {s}
            </button>
          ))}
        </div>
      </Card>

      {/* Bulk actions bar */}
      {!isViewer && selected.length > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-2 rounded-xl border border-brand-200 bg-brand-50 p-3 dark:border-brand-800 dark:bg-brand-950/30">
          <span className="text-sm font-medium text-brand-700 dark:text-brand-300">
            {selected.length} selected
          </span>
          <select
            onChange={(e) => {
              if (e.target.value) {
                bulkUpdateStatus(selected, e.target.value as ScreeningStatus);
                setSelected([]);
              }
            }}
            className="rounded-lg border border-brand-200 bg-white px-2 py-1.5 text-xs dark:border-brand-700 dark:bg-slate-900"
          >
            <option value="">Change status...</option>
            {ALL_STATUSES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <button
            onClick={() => {
              const tag: CandidateTag = { id: crypto.randomUUID(), name: "Bulk Tag", color: "#f43f5e" };
              bulkAddTag(selected, tag);
              setSelected([]);
            }}
            className="rounded-lg border border-brand-200 bg-white px-2.5 py-1.5 text-xs font-medium text-brand-700 hover:bg-brand-100 dark:border-brand-700 dark:bg-slate-900"
          >
            Add tag
          </button>
          <button
            onClick={() => {
              if (confirm(`Delete ${selected.length} candidates?`)) {
                bulkDelete(selected);
                setSelected([]);
              }
            }}
            className="rounded-lg border border-rose-200 bg-white px-2.5 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50 dark:border-rose-800 dark:bg-slate-900"
          >
            <Trash2 className="mr-1 inline h-3 w-3" /> Delete
          </button>
          <button
            onClick={() => setSelected([])}
            className="ml-auto text-xs text-slate-400 hover:text-slate-600"
          >
            Clear
          </button>
        </div>
      )}

      {rows.length === 0 ? (
        <EmptyState
          icon={<Users className="h-6 w-6" />}
          title={ws.candidates.length ? "No matches for these filters" : "No candidates yet"}
          description={
            ws.candidates.length
              ? "Try clearing the search or switching filters."
              : "Run a screening to add candidates to your workspace."
          }
          action={!ws.candidates.length && <ButtonLink href="/screen">Run a screening</ButtonLink>}
        />
      ) : (
        <StaggerContainer className="space-y-3">
          {rows.map(({ candidate, best, jobMatch }, i) => (
            <StaggerItem key={candidate.id} className="relative">
              <CandidateRow
                candidate={candidate}
                screening={jobMatch ?? best ?? undefined}
                rank={sort === "score" ? i + 1 : undefined}
              />
              {!isViewer && (
                <label className="absolute right-4 top-4 hidden cursor-pointer items-center gap-1.5 text-[11px] font-medium text-slate-400 sm:flex">
                  <input
                    type="checkbox"
                    checked={selected.includes(candidate.id)}
                    onChange={() => toggleSelect(candidate.id)}
                    className="h-3.5 w-3.5 accent-brand-600"
                    aria-label={`Select ${candidate.resume.name ?? candidate.fileName} for comparison`}
                  />
                  compare
                </label>
              )}
            </StaggerItem>
          ))}
        </StaggerContainer>
      )}
    </div>
  );
}
