"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Loader2, X, Copy, Check, Mail, HelpCircle, GitCompareArrows } from "lucide-react";
import { Button } from "@/components/ui/primitives";
import { cn } from "@/lib/utils";
import type { Candidate, MatchResult } from "@/lib/types";

type Action = "compare" | "rejection-email" | "acceptance-email" | "interview-questions";

interface CopilotResult {
  action: Action;
  result: Record<string, unknown>;
}
export type { CopilotResult };

/* ───────────────────────── Small presentational bits ───────────────────── */

function ListSection({ title, items, tone }: { title: string; items: string[]; tone?: "good" | "bad" }) {
  if (!items?.length) return null;
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{title}</p>
      <ul className="mt-1.5 space-y-1">
        {items.map((s, i) => (
          <li key={i} className={cn("flex gap-1.5 text-xs leading-relaxed", tone === "good" ? "text-emerald-700 dark:text-emerald-300" : tone === "bad" ? "text-rose-700 dark:text-rose-300" : "text-slate-600 dark:text-slate-300")}>
            <span className="mt-[3px] h-1 w-1 shrink-0 rounded-full bg-current opacity-60" />
            {s}
          </li>
        ))}
      </ul>
    </div>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(text).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        });
      }}
      className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-medium text-brand-600 hover:bg-brand-50 dark:text-brand-400 dark:hover:bg-brand-950/40"
    >
      {copied ? <><Check className="h-3 w-3" /> Copied</> : <><Copy className="h-3 w-3" /> Copy</>}
    </button>
  );
}

/* ───────────────────────── Email result view ─────────────────────────── */

function EmailView({ subject, body }: { subject: string; body: string }) {
  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-700">
      <div className="flex items-center justify-between gap-2 border-b border-slate-100 bg-slate-50 px-3 py-2 dark:border-slate-800 dark:bg-slate-800/50">
        <p className="truncate text-xs font-semibold text-slate-700 dark:text-slate-200">{subject}</p>
        <CopyButton text={`Subject: ${subject}\n\n${body}`} />
      </div>
      <p className="whitespace-pre-wrap px-3 py-3 text-xs leading-relaxed text-slate-600 dark:text-slate-300">{body}</p>
    </div>
  );
}

/* ───────────────────────── Interview questions view ──────────────────── */

function QuestionsView({ r }: { r: Record<string, unknown> }) {
  return (
    <div className="space-y-3">
      {typeof r.opening === "string" && (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-xs italic text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300">
          {r.opening}
        </p>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        <ListSection title="Technical" items={r.technicalQuestions as string[]} />
        <ListSection title="Behavioral" items={r.behavioralQuestions as string[]} />
      </div>
      <ListSection title="Red flags to verify" items={r.redFlagsToCheck as string[]} tone="bad" />
    </div>
  );
}

/* ───────────────────────── Compare result view ────────────────────────── */

function CompareView({ r, nameA, nameB }: { r: Record<string, unknown>; nameA: string; nameB: string }) {
  return (
    <div className="space-y-3">
      <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-200">{r.comparison as string}</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-emerald-200/60 p-3 dark:border-emerald-500/25">
          <p className="mb-2 text-xs font-bold text-emerald-700 dark:text-emerald-300">{nameA}</p>
          <ListSection title="Strengths" items={r.candidateAStrengths as string[]} tone="good" />
          <ListSection title="Weaknesses" items={r.candidateAWeaknesses as string[]} tone="bad" />
        </div>
        <div className="rounded-xl border border-violet-200/60 p-3 dark:border-violet-500/25">
          <p className="mb-2 text-xs font-bold text-violet-700 dark:text-violet-300">{nameB}</p>
          <ListSection title="Strengths" items={r.candidateBStrengths as string[]} tone="good" />
          <ListSection title="Weaknesses" items={r.candidateBWeaknesses as string[]} tone="bad" />
        </div>
      </div>
      <div className="rounded-xl bg-brand-50 p-3 text-xs leading-relaxed text-brand-900 dark:bg-brand-950/40 dark:text-brand-100">
        <span className="font-semibold">Recommendation: </span>
        {r.recommendation as string}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <ListSection title={`Probe with ${nameA}`} items={r.probeA as string[]} />
        <ListSection title={`Probe with ${nameB}`} items={r.probeB as string[]} />
      </div>
    </div>
  );
}

/* ───────────────────────── Buttons + panel ────────────────────────────── */

async function callCopilot(action: Action, candidates: unknown[]): Promise<CopilotResult> {
  const res = await fetch("/api/copilot", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, candidates }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Copilot failed");
  return data as CopilotResult;
}

export function CopilotButtons({
  candidates,
  onResult,
  compact,
}: {
  candidates: Candidate[];
  onResult: (r: CopilotResult) => void;
  compact?: boolean;
}) {
  const [loadingAction, setLoadingAction] = useState<Action | null>(null);
  const [error, setError] = useState<string | null>(null);

  const canCompare = candidates.length === 2;

  async function run(action: Action) {
    setError(null);
    setLoadingAction(action);
    try {
      const payload = candidates.map((c) => {
        const bestScreening = c.screenings.reduce<(typeof c.screenings)[number] | null>(
          (acc, s) => (!acc || s.match.overallScore > acc.match.overallScore ? s : acc),
          null,
        );
        return {
          name: c.resume.name ?? c.applicantName ?? c.fileName ?? "Candidate",
          resume: c.resume,
          match: (bestScreening?.match ?? { overallScore: 0 } as unknown as MatchResult),
          jobTitle: bestScreening?.jobTitle ?? "the role",
        };
      });
      const r = await callCopilot(action, payload);
      onResult(r);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoadingAction(null);
    }
  }

  return (
    <div>
      <div className={cn("flex flex-wrap gap-2", compact && "gap-1.5")}>
        <Button
          size={compact ? "sm" : "md"}
          variant="outline"
          disabled={loadingAction !== null || !canCompare}
          onClick={() => run("compare")}
          className="border-violet-300 text-violet-700 hover:bg-violet-50 dark:border-violet-500/40 dark:text-violet-300"
        >
          {loadingAction === "compare" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <GitCompareArrows className="h-3.5 w-3.5" />}
          AI compare
        </Button>
        {candidates.length === 1 && (
          <>
            <Button
              size={compact ? "sm" : "md"}
              variant="outline"
              disabled={loadingAction !== null}
              onClick={() => run("interview-questions")}
              className="border-brand-300 text-brand-700 hover:bg-brand-50 dark:border-brand-500/40 dark:text-brand-300"
            >
              {loadingAction === "interview-questions" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <HelpCircle className="h-3.5 w-3.5" />}
              Interview plan
            </Button>
            <Button
              size={compact ? "sm" : "md"}
              variant="outline"
              disabled={loadingAction !== null}
              onClick={() => run("rejection-email")}
              className="border-rose-300 text-rose-600 hover:bg-rose-50 dark:border-rose-500/40 dark:text-rose-300"
            >
              {loadingAction === "rejection-email" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Mail className="h-3.5 w-3.5" />}
              Rejection email
            </Button>
            <Button
              size={compact ? "sm" : "md"}
              variant="outline"
              disabled={loadingAction !== null}
              onClick={() => run("acceptance-email")}
              className="border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-500/40 dark:text-emerald-300"
            >
              {loadingAction === "acceptance-email" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Mail className="h-3.5 w-3.5" />}
              Acceptance email
            </Button>
          </>
        )}
      </div>
      {error && <p className="mt-2 text-xs text-rose-500">{error}</p>}
    </div>
  );
}

export function CopilotPanel({
  data,
  onClose,
  nameA,
  nameB,
}: {
  data: CopilotResult;
  onClose: () => void;
  nameA?: string;
  nameB?: string;
}) {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        className="mt-4 rounded-2xl border border-brand-200/70 bg-white p-4 shadow-lg dark:border-brand-500/25 dark:bg-slate-900"
      >
        <div className="mb-3 flex items-center justify-between">
          <p className="flex items-center gap-1.5 text-sm font-semibold text-brand-700 dark:text-brand-300">
            <Sparkles className="h-4 w-4" /> AI Copilot
          </p>
          <button onClick={onClose} aria-label="Close copilot result" className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
            <X className="h-4 w-4" />
          </button>
        </div>

        {data.action === "compare" ? (
          <CompareView r={data.result} nameA={nameA ?? "Candidate A"} nameB={nameB ?? "Candidate B"} />
        ) : data.action === "interview-questions" ? (
          <QuestionsView r={data.result} />
        ) : (
          <EmailView subject={data.result.subject as string} body={data.result.body as string} />
        )}
      </motion.div>
    </AnimatePresence>
  );
}
