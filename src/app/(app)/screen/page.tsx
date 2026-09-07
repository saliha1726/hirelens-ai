"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  Brain,
  Briefcase,
  ChevronDown,
  CircleCheck,
  FileSearch,
  Loader2,
  Save,
  ScanSearch,
  Sparkles,
} from "lucide-react";
import type { AIInsight, JobRequirements, MatchResult, ParsedResume } from "@/lib/types";
import { Button, ButtonLink, Card, CardContent, ErrorState } from "@/components/ui/primitives";
import { ScoreRing } from "@/components/ui/score-ring";
import { ResumeDropzone, type PendingFile } from "@/components/screening/dropzone";
import { ScoreBreakdown, StrengthsGaps, EvidenceList, AIInsightCard } from "@/components/candidate/match-views";
import { importScreeningResult, saveJob, useWorkspace } from "@/lib/client/store";
import { cn, titleCaseName } from "@/lib/utils";

interface ResultEntry {
  fileName: string;
  resume?: ParsedResume;
  match?: MatchResult;
  aiInsight?: AIInsight;
  aiError?: string;
  mlScore?: {
    index: number;
    tfidf_similarity: number;
    score: number;
    top_terms: { term: string; jd_weight: number; resume_weight: number }[];
    predicted_band: string;
    confidence: number;
    probabilities: Record<string, number>;
  };
  error?: string;
}

interface ScreenResponse {
  job: JobRequirements;
  results: ResultEntry[];
  aiEnabled: boolean;
  mlEnabled?: boolean;
  error?: string;
}

export default function ScreenPage() {
  const ws = useWorkspace();
  const [jdText, setJdText] = useState("");
  const [selectedJobId, setSelectedJobId] = useState<string>("");
  const [files, setFiles] = useState<PendingFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ScreenResponse | null>(null);
  const [savedJob, setSavedJob] = useState(false);

  const validCount = files.filter((f) => !f.error).length;

  async function runScreening() {
    setError(null);
    setResult(null);
    setSavedJob(false);
    if (validCount === 0) {
      setError("Add at least one valid resume file.");
      return;
    }
    const usingSaved = selectedJobId !== "";
    if (!usingSaved && jdText.trim().length < 80) {
      setError("Paste a job description (at least 80 characters) or select a saved job.");
      return;
    }
    setLoading(true);
    try {
      const form = new FormData();
      files.filter((f) => !f.error).forEach((f) => form.append("files", f.file));
      if (usingSaved) {
        form.append("job", JSON.stringify(ws.jobs.find((j) => j.id === selectedJobId)));
      } else {
        form.append("jdText", jdText);
      }
      const res = await fetch("/api/screen", { method: "POST", body: form });
      let data: ScreenResponse & { error?: string };
      try {
        data = await res.json();
      } catch {
        throw new Error(`Server returned ${res.status}. Please try again.`);
      }
      if (!res.ok && !data.results?.length) {
        throw new Error(data.error ?? `Request failed (${res.status})`);
      }
      if (data.error) setError(data.error);
      // Persist to the local workspace.
      importScreeningResult({ job: data.job, results: data.results });
      setResult(data);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Screen resumes</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Upload resumes against a job description and get ranked, explainable matches.
        </p>
      </div>

      <AnimatePresence>
        {error && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mb-5">
            <ErrorState title="Screening problem" message={error} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results */}
      <AnimatePresence>
        {result && (
          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
            aria-label="Screening results"
          >
            <Card className="mb-4 border-brand-200/70 dark:border-brand-500/25">
              <CardContent className="flex flex-wrap items-center justify-between gap-3 pt-5">
                <div>
                  <p className="flex items-center gap-2 font-semibold">
                    <CircleCheck className="h-4 w-4 text-emerald-500" />
                    {result.job.title}
                  </p>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                {result.job.requiredSkills.length} required skills · {result.job.preferredSkills.length} preferred
                {result.job.minYearsExperience != null && ` · ${result.job.minYearsExperience}+ yrs`} ·{" "}
                {result.results.filter((r) => r.match).length} candidates scored
                {result.mlEnabled && " · ML analysis (Scikit-learn)"}
              </p>
                </div>
                <div className="flex gap-2">
                  {!savedJob && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        saveJob(result.job);
                        setSavedJob(true);
                      }}
                    >
                      <Save className="h-3.5 w-3.5" /> Save job
                    </Button>
                  )}
                  <ButtonLink href="/candidates" size="sm" variant="secondary">
                    View workspace
                  </ButtonLink>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-3">
              {result.results.map((r, i) =>
                r.match && r.resume ? (
                  <ResultCard key={r.fileName + i} entry={r as Required<Pick<ResultEntry, "fileName">> & ResultEntry} rank={i + 1} />
                ) : (
                  <Card key={r.fileName + i} className="border-rose-200/70 p-4 dark:border-rose-500/25">
                    <p className="text-sm font-medium">{r.fileName}</p>
                    <p className="mt-1 text-xs text-rose-600 dark:text-rose-300">{r.error}</p>
                  </Card>
                ),
              )}
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* Input panel */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardContent className="pt-5">
            <h2 className="flex items-center gap-2 font-semibold">
              <Briefcase className="h-4 w-4 text-brand-500" /> 1. The job
            </h2>
            {ws.jobs.length > 0 && (
              <div className="mt-3">
                <label htmlFor="job-select" className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  Use a saved job
                </label>
                <select
                  id="job-select"
                  value={selectedJobId}
                  onChange={(e) => {
                    setSelectedJobId(e.target.value);
                    if (e.target.value) setJdText("");
                  }}
                  className="focus-ring mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-900"
                >
                  <option value="">— Paste a new description instead —</option>
                  {ws.jobs.map((j) => (
                    <option key={j.id} value={j.id}>
                      {j.title}{j.company ? ` · ${j.company}` : ""}
                    </option>
                  ))}
                </select>
              </div>
            )}
            {selectedJobId === "" && (
              <div className="mt-3">
                <label htmlFor="jd-text" className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  Or paste the job description (min. 80 characters)
                </label>
                <textarea
                  id="jd-text"
                  value={jdText}
                  onChange={(e) => setJdText(e.target.value)}
                  rows={10}
                  maxLength={30000}
                  placeholder={"Senior Frontend Engineer at Acme Inc.\n\nRequirements\n- 5+ years of frontend experience\n- Deep React and TypeScript expertise\n- ..."}
                  className="focus-ring mt-1 w-full resize-y rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm placeholder:text-slate-400 dark:border-slate-700 dark:bg-slate-900"
                />
                <p className="mt-1 text-right text-[11px] text-slate-400">{jdText.length.toLocaleString()} / 30,000</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5">
            <h2 className="flex items-center gap-2 font-semibold">
              <ScanSearch className="h-4 w-4 text-violet-500" /> 2. The resumes
            </h2>
            <div className="mt-3">
              <ResumeDropzone files={files} onChange={setFiles} disabled={loading} />
            </div>
            <Button
              onClick={runScreening}
              loading={loading}
              disabled={validCount === 0 || (selectedJobId === "" && jdText.trim().length < 80)}
              size="lg"
              className="mt-4 w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-1 h-4 w-4 animate-spin" /> Parsing & scoring…
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" /> Run screening ({validCount})
                </>
              )}
            </Button>
            <p className="mt-2 text-center text-[11px] leading-relaxed text-slate-400">
              Files are processed server-side, validated for type & size, and never stored on our servers.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Loading skeleton results */}
      {loading && (
        <div className="mt-8 space-y-3" aria-live="polite">
          {[...Array(Math.min(3, Math.max(1, validCount)))].map((_, i) => (
            <Card key={i} className="animate-pulse p-4">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-full bg-slate-200 dark:bg-slate-800" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-1/3 rounded bg-slate-200 dark:bg-slate-800" />
                  <div className="h-3 w-1/4 rounded bg-slate-100 dark:bg-slate-800/70" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function ResultCard({
  entry,
  rank,
}: {
  entry: ResultEntry & { fileName: string };
  rank: number;
}) {
  const [open, setOpen] = useState(rank === 1);
  const name = entry.resume!.name ?? titleCaseName(entry.fileName);
  return (
    <motion.div layout initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: rank * 0.06 }}>
      <Card className="overflow-hidden">
        <button
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          className="flex w-full items-center gap-4 p-4 text-left transition-colors hover:bg-slate-50/70 sm:p-5 dark:hover:bg-slate-800/40"
        >
          <span className="w-6 shrink-0 text-center text-sm font-semibold tabular-nums text-slate-400">{rank}</span>
          <ScoreRing score={entry.match!.overallScore} size={64} strokeWidth={7} delay={rank * 120} />
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold">{name}</p>
            <p className="truncate text-xs text-slate-500 dark:text-slate-400">
              {entry.resume!.skills.slice(0, 6).map((s) => s.name).join(" · ")}
              {entry.resume!.skills.length > 6 ? " …" : ""}
            </p>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              <Chip ok>{entry.match!.matchedSkills.length}/{Math.max(1, entry.match!.matchedSkills.length + entry.match!.missingSkills.length)} required skills</Chip>
              {typeof entry.resume!.totalYearsExperience === "number" && (
                <Chip>≈{entry.resume!.totalYearsExperience} yrs</Chip>
              )}
              {entry.aiInsight ? (
                <Chip ai>AI insight ready</Chip>
              ) : entry.aiError ? (
                <Chip warn>AI unavailable</Chip>
              ) : null}
              {entry.mlScore && (
                <Chip ml>ML: {Math.round(entry.mlScore.score)}% · {entry.mlScore.predicted_band}</Chip>
              )}
            </div>
          </div>
          <ChevronDown className={cn("h-4 w-4 shrink-0 text-slate-400 transition-transform duration-300", open && "rotate-180")} />
        </button>

        <AnimatePresence initial={false}>
          {open && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden border-t border-slate-100 dark:border-slate-800"
            >
              <div className="grid gap-6 p-5 lg:grid-cols-2">
                <div>
                  <h4 className="mb-3 text-sm font-semibold">Why this score</h4>
                  <ScoreBreakdown match={entry.match!} compact />
                </div>
                <div className="space-y-4">
                  <StrengthsGaps match={entry.match!} />
                  {entry.match!.missingSkills.length > 0 && (
                    <div>
                      <h4 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">Missing requirements</h4>
                      <div className="flex flex-wrap gap-1.5">
                        {entry.match!.missingSkills.map((s) => (
                          <span key={s} className="rounded-md bg-rose-50 px-2 py-0.5 text-xs font-medium text-rose-700 dark:bg-rose-950/50 dark:text-rose-300">
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <AIInsightCard insight={entry.aiInsight} error={entry.aiError} />
                {entry.mlScore && (
                  <div className="rounded-xl border border-cyan-200/70 bg-cyan-50/30 p-4 dark:border-cyan-500/25 dark:bg-cyan-950/20">
                    <h4 className="flex items-center gap-1.5 text-sm font-semibold text-cyan-800 dark:text-cyan-300">
                      <Brain className="h-4 w-4" /> ML analysis — Scikit-learn
                    </h4>
                    <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                      Second opinion from the Python microservice (TF-IDF + RandomForest). Independent of the deterministic score.
                    </p>
                    <div className="mt-3 flex flex-wrap items-center gap-3">
                      <div>
                        <p className="text-2xl font-bold text-cyan-700 dark:text-cyan-300">{Math.round(entry.mlScore.score)}%</p>
                        <p className="text-[10px] uppercase tracking-wide text-slate-400">TF-IDF similarity</p>
                      </div>
                      <div className="h-8 w-px bg-slate-200 dark:bg-slate-700" />
                      <div>
                        <p className="text-sm font-semibold capitalize text-cyan-700 dark:text-cyan-300">{entry.mlScore.predicted_band} match</p>
                        <p className="text-[10px] text-slate-400">{Math.round(entry.mlScore.confidence * 100)}% classifier confidence</p>
                      </div>
                    </div>
                    {entry.mlScore.top_terms.length > 0 && (
                      <div className="mt-3">
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Strongest shared terms</p>
                        <div className="mt-1.5 flex flex-wrap gap-1">
                          {entry.mlScore.top_terms.slice(0, 8).map((t) => (
                            <span key={t.term} className="rounded-md bg-cyan-100/70 px-1.5 py-0.5 text-[10px] font-medium text-cyan-800 dark:bg-cyan-900/50 dark:text-cyan-300">
                              {t.term}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
                <div>
                  <h4 className="mb-3 text-sm font-semibold">Evidence from resume</h4>
                  <EvidenceList match={entry.match!} />
                </div>
              </div>
              <div className="border-t border-slate-100 px-5 py-3 text-right dark:border-slate-800">
                <Link href="/candidates" className="text-xs font-medium text-brand-600 hover:underline dark:text-brand-400">
                  Open in workspace →
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  );
}

function Chip({ children, ok, warn, ai, ml }: { children: React.ReactNode; ok?: boolean; warn?: boolean; ai?: boolean; ml?: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium",
        ok && "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300",
        warn && "bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300",
        ai && "bg-violet-50 text-violet-700 dark:bg-violet-950/50 dark:text-violet-300",
        ml && "bg-cyan-50 text-cyan-700 dark:bg-cyan-950/50 dark:text-cyan-300",
        !ok && !warn && !ai && !ml && "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
      )}
    >
      {ai && <Brain className="h-3 w-3" />}
      {ml && <Brain className="h-3 w-3" />}
      {children}
    </span>
  );
}
