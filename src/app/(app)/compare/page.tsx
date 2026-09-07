"use client";

import { use, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, GitCompareArrows, Users } from "lucide-react";
import { useWorkspace } from "@/lib/client/store";
import { ButtonLink, Card, CardContent, EmptyState } from "@/components/ui/primitives";
import { ScoreRing } from "@/components/ui/score-ring";
import { scoreTone } from "@/lib/utils";
import { CopilotButtons, CopilotPanel, type CopilotResult } from "@/components/ai/copilot";

export default function ComparePage({ searchParams }: { searchParams: Promise<{ a?: string; b?: string }> }) {
  const { a, b } = use(searchParams);
  const ws = useWorkspace();
  const [copilot, setCopilot] = useState<CopilotResult | null>(null);

  const ca = ws.candidates.find((c) => c.id === a);
  const cb = ws.candidates.find((c) => c.id === b);

  const bestA = useMemo(() => bestScreening(ca), [ca]);
  const bestB = useMemo(() => bestScreening(cb), [cb]);

  if (!ca || !cb || !bestA || !bestB) {
    return (
      <div className="mx-auto max-w-3xl">
        <EmptyState
          icon={<Users className="h-6 w-6" />}
          title="Pick two candidates to compare"
          description={
            ws.candidates.length >= 2
              ? "Select two candidates from the Candidates page using the “compare” checkboxes."
              : "You need at least two screened candidates in your workspace first."
          }
          action={<ButtonLink href="/candidates">Go to candidates</ButtonLink>}
        />
      </div>
    );
  }

  const nameOf = (c: typeof ca) => c.resume.name ?? c.fileName ?? "Candidate";
  const factors = bestA.match.factors.map((f, i) => ({ ...f, other: bestB.match.factors[i] }));

  return (
    <div className="mx-auto max-w-5xl">
      <Link href="/candidates" className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-brand-600 dark:text-slate-400">
        <ArrowLeft className="h-4 w-4" /> All candidates
      </Link>

      <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
        <GitCompareArrows className="h-6 w-6 text-brand-500" /> Candidate comparison
      </h1>

      <div className="mt-4">
        <CopilotButtons candidates={[ca, cb]} onResult={(r) => setCopilot(r)} />
        {copilot && (
          <CopilotPanel
            data={copilot}
            onClose={() => setCopilot(null)}
            nameA={nameOf(ca)}
            nameB={nameOf(cb)}
          />
        )}
      </div>

      {/* Head-to-head */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {[ca, cb].map((c, i) => {
          const s = i === 0 ? bestA : bestB;
          return (
            <Card key={c.id} className={i === 0 ? "" : ""}>
              <CardContent className="pt-5">
                <div className="flex items-center gap-4">
                  <ScoreRing score={s.match.overallScore} size={84} strokeWidth={9} />
                  <div className="min-w-0">
                    <p className="truncate text-lg font-semibold">{nameOf(c)}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{s.jobTitle}</p>
                    {typeof c.resume.totalYearsExperience === "number" && (
                      <p className="text-xs text-slate-400">≈{c.resume.totalYearsExperience} yrs · <span className="capitalize">{c.resume.seniority}</span></p>
                    )}
                    <Link href={`/candidates/${c.id}`} className="mt-1 inline-block text-xs font-medium text-brand-600 hover:underline dark:text-brand-400">
                      View full profile →
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Factor-by-factor */}
      <Card className="mt-5 overflow-hidden">
        <CardContent className="pt-5">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-400">Factor-by-factor</h2>
          <div className="space-y-4">
            {factors.map(({ key, label, score, weight, other }) => {
              const aWins = score > (other?.score ?? -1);
              const bWins = (other?.score ?? -1) > score;
              return (
                <div key={key}>
                  <div className="mb-1.5 flex items-baseline justify-between text-xs">
                    <span className={aWins ? "font-bold" : "text-slate-500"}>
                      {score}%{aWins ? " ◀" : ""}
                    </span>
                    <span className="font-medium">{label} <span className="ml-1 text-slate-400">(w{weight})</span></span>
                    <span className={bWins ? "font-bold" : "text-slate-500"}>
                      {bWins ? "▶ " : ""}{other!.score}%
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <DualBar value={score} side="left" />
                    <DualBar value={other!.score} side="right" />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Skills diff */}
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        {[0, 1].map((i) => {
          const s = i === 0 ? bestA : bestB;
          const c = i === 0 ? ca : cb;
          return (
            <Card key={i}>
              <CardContent className="pt-5">
                <h3 className="mb-3 text-sm font-semibold">{nameOf(c)}</h3>
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-emerald-600 dark:text-emerald-400">Has</p>
                <div className="mb-3 flex flex-wrap gap-1.5">
                  {s.match.matchedSkills.map((sk) => (
                    <span key={sk} className="rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">{sk}</span>
                  ))}
                </div>
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-rose-500 dark:text-rose-400">Missing</p>
                <div className="flex flex-wrap gap-1.5">
                  {s.match.missingSkills.length
                    ? s.match.missingSkills.map((sk) => (
                        <span key={sk} className="rounded-md bg-rose-50 px-2 py-0.5 text-xs font-medium text-rose-600 dark:bg-rose-950/50 dark:text-rose-300">{sk}</span>
                      ))
                    : <span className="text-xs text-slate-400">none</span>}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function bestScreening(candidate?: ReturnType<typeof useWorkspace>["candidates"][number]) {
  if (!candidate) return null;
  return candidate.screenings.reduce<null | (typeof candidate.screenings)[number]>(
    (acc, s) => (!acc || s.match.overallScore > acc.match.overallScore ? s : acc),
    null,
  );
}

function DualBar({ value, side }: { value: number; side: "left" | "right" }) {
  const tone = scoreTone(value);
  const colors = { high: "#10b981", good: "#3b6bf6", fair: "#f59e0b", low: "#f43f5e" };
  return (
    <div className="relative h-2.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
      <div
        className={side === "right" ? "absolute right-0 h-full rounded-full" : "absolute left-0 h-full rounded-full"}
        style={{
          width: `${value}%`,
          background: colors[tone],
          transition: "width 1s cubic-bezier(0.22,1,0.36,1)",
        }}
      />
    </div>
  );
}
