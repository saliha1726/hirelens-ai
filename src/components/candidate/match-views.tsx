"use client";

import { motion } from "framer-motion";
import { Brain, CircleCheck, CircleAlert, Quote, ShieldCheck } from "lucide-react";
import type { AIInsight, MatchResult, ScreeningStatus } from "@/lib/types";
import { Badge, Card, CardContent, CardHeader, CardTitle } from "@/components/ui/primitives";
import { FactorBar } from "@/components/ui/score-ring";
import { cn } from "@/lib/utils";

const STATUS_TONES: Record<ScreeningStatus, { tone: Parameters<typeof Badge>[0]["tone"]; label: string }> = {
  new: { tone: "neutral", label: "New" },
  shortlisted: { tone: "brand", label: "Shortlisted" },
  interview: { tone: "warning", label: "Interview" },
  rejected: { tone: "danger", label: "Rejected" },
  hired: { tone: "success", label: "Hired" },
};

export function StatusBadge({ status }: { status: ScreeningStatus }) {
  const s = STATUS_TONES[status];
  return <Badge tone={s.tone}>{s.label}</Badge>;
}

/** The explainable score breakdown — the heart of the product. */
export function ScoreBreakdown({ match, compact = false }: { match: MatchResult; compact?: boolean }) {
  return (
    <div className={cn("space-y-4", compact && "space-y-3")}>
      {match.factors.map((f, i) => (
        <motion.div
          key={f.key}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.06 * i, duration: 0.35 }}
        >
          <div className="mb-1.5 flex items-baseline justify-between gap-3">
            <span className="text-sm font-medium">{f.label}</span>
            <span className="text-sm tabular-nums text-slate-500 dark:text-slate-400">
              <span className="font-semibold text-slate-900 dark:text-white">{f.score}%</span>
              <span className="ml-1.5 text-xs">· weight {f.weight}</span>
            </span>
          </div>
          <FactorBar score={f.score} weight={f.weight} delay={i * 60} />
          {!compact && <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">{f.detail}</p>}
        </motion.div>
      ))}
    </div>
  );
}

export function StrengthsGaps({ match }: { match: MatchResult }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="rounded-xl border border-emerald-200/70 bg-emerald-50/50 p-4 dark:border-emerald-500/20 dark:bg-emerald-950/20">
        <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold text-emerald-800 dark:text-emerald-300">
          <CircleCheck className="h-4 w-4" /> Matching strengths
        </h4>
        {match.strengths.length ? (
          <ul className="space-y-1.5">
            {match.strengths.map((s, i) => (
              <li key={i} className="text-xs leading-relaxed text-emerald-800/90 dark:text-emerald-300/90">
                • {s.label}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-emerald-700/70 dark:text-emerald-400/70">No standout strengths detected.</p>
        )}
      </div>
      <div className="rounded-xl border border-rose-200/70 bg-rose-50/50 p-4 dark:border-rose-500/20 dark:bg-rose-950/20">
        <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold text-rose-800 dark:text-rose-300">
          <CircleAlert className="h-4 w-4" /> Gaps & missing requirements
        </h4>
        {match.gaps.length ? (
          <ul className="space-y-1.5">
            {match.gaps.map((g, i) => (
              <li key={i} className="text-xs leading-relaxed text-rose-800/90 dark:text-rose-300/90">
                <Badge tone={g.severity === "critical" ? "danger" : g.severity === "moderate" ? "warning" : "neutral"} className="mr-1.5">
                  {g.severity}
                </Badge>
                {g.label}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-rose-700/70 dark:text-rose-400/70">No significant gaps detected.</p>
        )}
      </div>
    </div>
  );
}

export function EvidenceList({ match }: { match: MatchResult }) {
  if (!match.evidence.length) return <p className="text-sm text-slate-500 dark:text-slate-400">No direct evidence quotes available.</p>;
  return (
    <ul className="space-y-2.5">
      {match.evidence.map((e, i) => (
        <li key={i} className="rounded-xl border border-slate-200 bg-slate-50/60 p-3 dark:border-slate-800 dark:bg-slate-900/60">
          <Badge tone="brand" className="mb-1.5">{e.term}</Badge>
          <p className="flex gap-2 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
            <Quote className="mt-0.5 h-3 w-3 shrink-0 text-slate-400" />
            <span className="italic">{e.quote}</span>
          </p>
        </li>
      ))}
    </ul>
  );
}

const BAND_META: Record<AIInsight["recommendationBand"], { label: string; tone: Parameters<typeof Badge>[0]["tone"] }> = {
  "strong-match": { label: "Strong match", tone: "success" },
  "good-match": { label: "Good match", tone: "brand" },
  "possible-match": { label: "Possible match", tone: "warning" },
  "weak-match": { label: "Weak match", tone: "danger" },
};

export function AIInsightCard({ insight, error }: { insight?: AIInsight; error?: string }) {
  if (error && !insight) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-4 w-4 text-violet-500" /> AI interpretation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-500 dark:text-slate-400">{error}</p>
          <p className="mt-2 text-xs text-slate-400">
            The deterministic score above is unaffected — it is computed by rules, not AI.
          </p>
        </CardContent>
      </Card>
    );
  }
  if (!insight) return null;

  const band = BAND_META[insight.recommendationBand];
  return (
    <Card className="border-violet-200/70 dark:border-violet-500/25">
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-4 w-4 text-violet-500" /> AI interpretation
          </CardTitle>
          <Badge tone={band.tone}>{band.label}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">{insight.summary}</p>
        <div className="grid gap-4 sm:grid-cols-3">
          {insight.topStrengths.length > 0 && (
            <div>
              <h5 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-400">Strengths</h5>
              <ul className="space-y-1">
                {insight.topStrengths.map((s, i) => (
                  <li key={i} className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">• {s}</li>
                ))}
              </ul>
            </div>
          )}
          {insight.concerns.length > 0 && (
            <div>
              <h5 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-amber-600 dark:text-amber-400">Concerns</h5>
              <ul className="space-y-1">
                {insight.concerns.map((s, i) => (
                  <li key={i} className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">• {s}</li>
                ))}
              </ul>
            </div>
          )}
          {insight.interviewFocus.length > 0 && (
            <div>
              <h5 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-brand-600 dark:text-brand-400">Interview focus</h5>
              <ul className="space-y-1">
                {insight.interviewFocus.map((s, i) => (
                  <li key={i} className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">• {s}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
        <p className="flex items-center gap-1.5 border-t border-slate-100 pt-3 text-[11px] text-slate-400 dark:border-slate-800">
          <ShieldCheck className="h-3.5 w-3.5" />
          Interpretation only — generated by {insight.modelUsed}. It cannot change the deterministic score. Protected characteristics are excluded.
        </p>
      </CardContent>
    </Card>
  );
}
