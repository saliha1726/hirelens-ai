"use client";

import { use, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, XCircle, Lightbulb, Loader2, Target, Sparkles } from "lucide-react";
import { Logo } from "@/components/layout/app-shell";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { ScoreRing } from "@/components/ui/score-ring";

interface Feedback {
  candidateName: string | null;
  jobTitle: string | null;
  score: number | null;
  matchedSkills: string[];
  missingSkills: string[];
  suggestedSkills: string[];
  screeningsCount: number;
}

const ENCOURAGEMENTS: Array<{ min: number; title: string; body: string }> = [
  { min: 80, title: "Excellent fit!", body: "Your profile aligns strongly with what this role needs. The team was impressed by your skill coverage." },
  { min: 65, title: "Strong application", body: "You have a solid foundation for this role. Strengthening the highlighted skills below would make you even more competitive." },
  { min: 45, title: "Promising profile", body: "You have relevant potential. Focusing on the skills listed below would significantly boost your fit for roles like this." },
  { min: 0, title: "Keep growing", body: "This particular role needed a different skill profile, but building the skills below opens doors to similar positions." },
];

export default function CandidateFeedbackPage({
  params,
}: {
  params: Promise<{ wsId: string; candidateId: string }>;
}) {
  const { wsId, candidateId } = use(params);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get("token");
    fetch(`/api/candidate-feedback?wsId=${wsId}&candidateId=${candidateId}&token=${token}`)
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) throw new Error(data.error ?? "Could not load feedback");
        setFeedback(data.feedback);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Could not load feedback"))
      .finally(() => setLoading(false));
  }, [wsId, candidateId]);

  const encouragement =
    ENCOURAGEMENTS.find((e) => (feedback?.score ?? 0) >= e.min) ?? ENCOURAGEMENTS[ENCOURAGEMENTS.length - 1];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-brand-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-brand-950/20">
      <header className="glass sticky top-0 z-50 border-b border-slate-200/60 dark:border-slate-800/60">
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-4 sm:px-6">
          <Logo />
          <ThemeToggle />
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        {loading && (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
          </div>
        )}

        {error && (
          <div className="py-20 text-center">
            <XCircle className="mx-auto h-12 w-12 text-rose-400" />
            <h1 className="mt-4 text-xl font-bold text-slate-700 dark:text-slate-200">Link unavailable</h1>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{error}</p>
          </div>
        )}

        {feedback && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            <div className="text-center">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Application feedback</p>
              <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
                {feedback.candidateName ? `Hi ${feedback.candidateName.split(" ")[0]}!` : "Hello!"}
              </h1>
              {feedback.jobTitle && (
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  for <span className="font-semibold">{feedback.jobTitle}</span>
                </p>
              )}
            </div>

            {/* Score + encouragement */}
            <div className="mt-8 flex flex-col items-center gap-6 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:flex-row sm:items-center sm:gap-8">
              {feedback.score != null && (
                <ScoreRing score={feedback.score} size={130} strokeWidth={12} />
              )}
              <div className="text-center sm:text-left">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">{encouragement.title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">{encouragement.body}</p>
                {feedback.score != null && (
                  <p className="mt-3 text-xs text-slate-400">
                    Score measures skill alignment with the job requirements — it&apos;s guidance, not a verdict.
                  </p>
                )}
              </div>
            </div>

            {/* Skills grid */}
            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              {feedback.matchedSkills.length > 0 && (
                <div className="rounded-2xl border border-emerald-200/70 bg-emerald-50/40 p-5 dark:border-emerald-500/25 dark:bg-emerald-950/20">
                  <h3 className="flex items-center gap-1.5 text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                    <CheckCircle2 className="h-4 w-4" /> Your strengths
                  </h3>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {feedback.matchedSkills.map((s) => (
                      <span key={s} className="rounded-md bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {feedback.missingSkills.length > 0 && (
                <div className="rounded-2xl border border-amber-200/70 bg-amber-50/40 p-5 dark:border-amber-500/25 dark:bg-amber-950/20">
                  <h3 className="flex items-center gap-1.5 text-sm font-semibold text-amber-700 dark:text-amber-300">
                    <Target className="h-4 w-4" /> Skills to develop
                  </h3>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {feedback.missingSkills.map((s) => (
                      <span key={s} className="rounded-md bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900/50 dark:text-amber-300">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Growth tip */}
            {feedback.suggestedSkills.length > 0 && (
              <div className="mt-5 rounded-2xl border border-brand-200/70 bg-brand-50/40 p-5 dark:border-brand-500/25 dark:bg-brand-950/20">
                <h3 className="flex items-center gap-1.5 text-sm font-semibold text-brand-700 dark:text-brand-300">
                  <Lightbulb className="h-4 w-4" /> Growth suggestion
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                  Consider building hands-on projects with <strong>{feedback.suggestedSkills.slice(0, 3).join(", ")}</strong> —
                  these appeared frequently in the requirements for this role.
                </p>
              </div>
            )}

            {feedback.screeningsCount > 1 && (
              <p className="mt-6 text-center text-xs text-slate-400">
                <Sparkles className="mr-1 inline h-3 w-3" />
                You&apos;ve been matched against {feedback.screeningsCount} roles.
              </p>
            )}
          </motion.div>
        )}
      </div>

      <footer className="border-t border-slate-200 py-8 dark:border-slate-800">
        <div className="mx-auto max-w-6xl px-4 text-center text-xs text-slate-400 sm:px-6">
          Powered by <strong>HireLens AI</strong> · Feedback is guidance for growth, never a final judgment
        </div>
      </footer>
    </div>
  );
}
