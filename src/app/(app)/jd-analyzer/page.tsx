"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileSearch, Sparkles, Loader2, CheckCircle2, AlertTriangle, Lightbulb, DollarSign, HeartHandshake, Wand2 } from "lucide-react";
import { Button, Card, CardContent } from "@/components/ui/primitives";
import { useRole } from "@/lib/hooks/use-role";

interface Analysis {
  qualityScore: number | null;
  strengths: string[];
  issues: string[];
  improvements: { section: string; suggestion: string }[];
  inclusiveLanguageNotes: string[];
  suggestedTitle: string;
  salaryRange: { min: number; max: number; currency: string; note: string } | null;
  aiPowered: boolean;
}

const SAMPLE_JD = `Senior React Developer

We are looking for a rockstar ninja developer who works hard and plays harder! The ideal candidate is young and energetic.

Requirements:
- React, TypeScript
- Experience with Node.js
- Familiarity with databases

Nice to have:
- GraphQL

Apply now!`;

export default function JDAnalyzerPage() {
  const { isViewer } = useRole();
  const [jdText, setJdText] = useState("");
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function analyze() {
    if (jdText.trim().length < 80) {
      setError("Paste at least 80 characters of the job description.");
      return;
    }
    setError(null);
    setAnalysis(null);
    setLoading(true);
    try {
      const res = await fetch("/api/jd-analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jdText }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Analysis failed");
      setAnalysis(data.analysis);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6">
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight sm:text-3xl">
          <FileSearch className="h-7 w-7 text-brand-500" /> JD Analyzer
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Paste any job description — get a quality score, concrete improvements, inclusive-language
          notes, and a market-informed salary range suggestion.
        </p>
      </div>

      <AnimatePresence>
        {error && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mb-5">
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700 dark:border-rose-800 dark:bg-rose-950/30 dark:text-rose-300">
              {error}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Input */}
        <Card className="lg:col-span-3">
          <CardContent className="pt-5">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">Job description</h2>
              <button
                onClick={() => setJdText(SAMPLE_JD)}
                className="rounded-lg px-2 py-1 text-[11px] font-medium text-brand-600 hover:bg-brand-50 dark:text-brand-400 dark:hover:bg-brand-950/40"
              >
                Try a sample with problems
              </button>
            </div>
            <textarea
              value={jdText}
              onChange={(e) => setJdText(e.target.value)}
              rows={14}
              maxLength={30000}
              disabled={isViewer}
              placeholder={"Paste the full job description here…\n\nTip: include requirements, responsibilities, and any info about the team."}
              className="focus-ring mt-3 w-full resize-y rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm placeholder:text-slate-400 dark:border-slate-700 dark:bg-slate-900 disabled:opacity-60"
            />
            <p className="mt-1 text-right text-[11px] text-slate-400">{jdText.length.toLocaleString()} / 30,000</p>
            <Button onClick={analyze} loading={loading} disabled={isViewer || jdText.trim().length < 80} className="mt-3 w-full">
              {loading ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Analyzing…</>
              ) : (
                <><Sparkles className="h-4 w-4" /> Analyze this JD</>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Results */}
        <div className="space-y-5 lg:col-span-2">
          {loading && (
            <Card className="animate-pulse p-6 dark:bg-slate-900">
              <div className="flex items-center gap-3">
                <Loader2 className="h-5 w-5 animate-spin text-brand-500" />
                <p className="text-sm text-slate-500">Evaluating structure, clarity, inclusion…</p>
              </div>
            </Card>
          )}

          {analysis && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
              {/* Score */}
              <Card className="border-brand-200/70 dark:border-brand-500/25">
                <CardContent className="pt-5">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold">Quality score</p>
                    {analysis.aiPowered && (
                      <span className="rounded-full bg-violet-50 px-2 py-0.5 text-[10px] font-medium text-violet-600 dark:bg-violet-950/50 dark:text-violet-300">
                        AI-powered
                      </span>
                    )}
                  </div>
                  {analysis.qualityScore != null ? (
                    <div className="mt-2 flex items-end gap-2">
                      <p className="text-4xl font-bold text-brand-600 dark:text-brand-400">{analysis.qualityScore}</p>
                      <p className="pb-1 text-sm text-slate-400">/ 100</p>
                    </div>
                  ) : (
                    <p className="mt-2 text-xs text-slate-400">AI layer unavailable — deterministic checks only.</p>
                  )}
                  {analysis.suggestedTitle && (
                    <p className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-xs dark:bg-slate-800/60">
                      <Wand2 className="mr-1 inline h-3 w-3 text-brand-500" />
                      Suggested title: <strong>{analysis.suggestedTitle}</strong>
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Salary */}
              {analysis.salaryRange && (
                <Card className="border-emerald-200/70 dark:border-emerald-500/25">
                  <CardContent className="pt-5">
                    <p className="flex items-center gap-1.5 text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                      <DollarSign className="h-4 w-4" /> Suggested salary range
                    </p>
                    <p className="mt-2 text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                      {analysis.salaryRange.currency} {analysis.salaryRange.min.toLocaleString()} – {analysis.salaryRange.max.toLocaleString()}
                    </p>
                    <p className="mt-1.5 text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">{analysis.salaryRange.note}</p>
                  </CardContent>
                </Card>
              )}

              {/* Strengths & issues */}
              <Card>
                <CardContent className="pt-5">
                  {analysis.strengths.length > 0 && (
                    <div className="mb-4">
                      <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="h-3.5 w-3.5" /> What works
                      </p>
                      <ul className="mt-2 space-y-1.5">
                        {analysis.strengths.map((s, i) => (
                          <li key={i} className="flex gap-1.5 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                            <span className="mt-[3px] h-1 w-1 shrink-0 rounded-full bg-emerald-400" />{s}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {analysis.issues.length > 0 && (
                    <div>
                      <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-amber-600 dark:text-amber-400">
                        <AlertTriangle className="h-3.5 w-3.5" /> Issues found
                      </p>
                      <ul className="mt-2 space-y-1.5">
                        {analysis.issues.map((s, i) => (
                          <li key={i} className="flex gap-1.5 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                            <span className="mt-[3px] h-1 w-1 shrink-0 rounded-full bg-amber-400" />{s}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Improvements */}
              {analysis.improvements.length > 0 && (
                <Card>
                  <CardContent className="pt-5">
                    <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-brand-600 dark:text-brand-400">
                      <Lightbulb className="h-3.5 w-3.5" /> Concrete improvements
                    </p>
                    <div className="mt-3 space-y-3">
                      {analysis.improvements.map((imp, i) => (
                        <div key={i} className="rounded-xl border border-slate-200 p-3 dark:border-slate-700">
                          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{imp.section}</p>
                          <p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-300">{imp.suggestion}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Inclusive language */}
              {analysis.inclusiveLanguageNotes.length > 0 && (
                <Card className="border-violet-200/70 dark:border-violet-500/25">
                  <CardContent className="pt-5">
                    <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-violet-600 dark:text-violet-400">
                      <HeartHandshake className="h-3.5 w-3.5" /> Inclusive language check
                    </p>
                    <ul className="mt-2 space-y-1.5">
                      {analysis.inclusiveLanguageNotes.map((s, i) => (
                        <li key={i} className="flex gap-1.5 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                          <span className="mt-[3px] h-1 w-1 shrink-0 rounded-full bg-violet-400" />{s}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </motion.div>
          )}

          {!loading && !analysis && (
            <Card className="hidden lg:block dark:bg-slate-900/60">
              <CardContent className="pt-5 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                <p className="font-medium text-slate-700 dark:text-slate-200">What gets analyzed</p>
                <ul className="mt-2 space-y-1.5 text-xs">
                  <li>• Structure: requirements, responsibilities, clarity</li>
                  <li>• Bias & inclusivity: coded language, exclusionary phrasing</li>
                  <li>• Searchability: title effectiveness</li>
                  <li>• Market: suggested salary range with reasoning</li>
                </ul>
                <p className="mt-3 text-[11px]">Works even without AI — deterministic checks always run.</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
