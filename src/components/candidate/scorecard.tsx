"use client";

import { useState } from "react";
import { Star, Save, X } from "lucide-react";
import type { InterviewScorecard } from "@/lib/types";
import { cn } from "@/lib/utils";

const CRITERIA = [
  { key: "cultureFit", label: "Culture Fit", description: "Alignment with team values and work style" },
  { key: "technicalSkill", label: "Technical Skill", description: "Domain expertise and problem-solving ability" },
  { key: "communication", label: "Communication", description: "Clarity, articulation, and listening skills" },
  { key: "problemSolving", label: "Problem Solving", description: "Analytical thinking and creative solutions" },
  { key: "leadership", label: "Leadership", description: "Initiative, ownership, and influence" },
  { key: "overallImpression", label: "Overall", description: "General impression and potential" },
] as const;

const RECOMMENDATIONS = [
  { value: "strong-hire", label: "Strong Hire", color: "bg-emerald-500 text-white" },
  { value: "hire", label: "Hire", color: "bg-emerald-400 text-white" },
  { value: "lean-hire", label: "Lean Hire", color: "bg-amber-400 text-white" },
  { value: "no-hire", label: "No Hire", color: "bg-orange-400 text-white" },
  { value: "strong-no-hire", label: "Strong No Hire", color: "bg-rose-500 text-white" },
] as const;

export function ScorecardForm({
  onSave,
  onCancel,
  existing,
}: {
  onSave: (scorecard: InterviewScorecard) => void;
  onCancel: () => void;
  existing?: InterviewScorecard;
}) {
  const [scores, setScores] = useState<Record<string, number>>(
    existing
      ? { cultureFit: existing.cultureFit, technicalSkill: existing.technicalSkill, communication: existing.communication, problemSolving: existing.problemSolving, leadership: existing.leadership, overallImpression: existing.overallImpression }
      : { cultureFit: 3, technicalSkill: 3, communication: 3, problemSolving: 3, leadership: 3, overallImpression: 3 },
  );
  const [strengths, setStrengths] = useState(existing?.strengths.join("\n") ?? "");
  const [concerns, setConcerns] = useState(existing?.concerns.join("\n") ?? "");
  const [recommendation, setRecommendation] = useState<InterviewScorecard["recommendation"]>(existing?.recommendation ?? "hire");
  const [notes, setNotes] = useState(existing?.additionalNotes ?? "");

  const avg = Math.round(Object.values(scores).reduce((a, b) => a + b, 0) / Object.values(scores).length * 20);

  function handleSave() {
    onSave({
      ...scores,
      cultureFit: scores.cultureFit,
      technicalSkill: scores.technicalSkill,
      communication: scores.communication,
      problemSolving: scores.problemSolving,
      leadership: scores.leadership,
      overallImpression: scores.overallImpression,
      strengths: strengths.split("\n").map((s) => s.trim()).filter(Boolean),
      concerns: concerns.split("\n").map((c) => c.trim()).filter(Boolean),
      recommendation,
      additionalNotes: notes,
    });
  }

  return (
    <div className="space-y-5">
      {/* Score criteria */}
      <div className="space-y-4">
        {CRITERIA.map((c) => (
          <div key={c.key}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{c.label}</p>
                <p className="text-[11px] text-slate-400">{c.description}</p>
              </div>
              <span className={cn(
                "tabular-nums text-sm font-bold",
                scores[c.key] >= 4 ? "text-emerald-600" : scores[c.key] >= 3 ? "text-amber-600" : "text-rose-600",
              )}>
                {scores[c.key]}/5
              </span>
            </div>
            <div className="mt-1.5 flex gap-1">
              {[1, 2, 3, 4, 5].map((v) => (
                <button
                  key={v}
                  onClick={() => setScores((prev) => ({ ...prev, [c.key]: v }))}
                  className={cn(
                    "flex-1 h-8 rounded-lg text-xs font-medium transition-all",
                    scores[c.key] === v
                      ? v >= 4 ? "bg-emerald-500 text-white" : v >= 3 ? "bg-amber-500 text-white" : "bg-rose-500 text-white"
                      : "bg-slate-100 text-slate-400 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700",
                  )}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Overall score bar */}
      <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800/50">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold">Overall Score</span>
          <span className={cn(
            "text-2xl font-bold tabular-nums",
            avg >= 80 ? "text-emerald-600" : avg >= 60 ? "text-amber-600" : "text-rose-600",
          )}>
            {avg}%
          </span>
        </div>
        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
          <div
            className={cn("h-full rounded-full transition-all", avg >= 80 ? "bg-emerald-500" : avg >= 60 ? "bg-amber-500" : "bg-rose-500")}
            style={{ width: `${avg}%` }}
          />
        </div>
      </div>

      {/* Recommendation */}
      <div>
        <p className="mb-2 text-sm font-medium">Recommendation</p>
        <div className="flex flex-wrap gap-1.5">
          {RECOMMENDATIONS.map((r) => (
            <button
              key={r.value}
              onClick={() => setRecommendation(r.value)}
              className={cn(
                "rounded-full px-3 py-1.5 text-xs font-medium transition-all",
                recommendation === r.value ? r.color : "bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-800",
              )}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* Strengths / Concerns */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">Strengths (one per line)</label>
          <textarea
            value={strengths}
            onChange={(e) => setStrengths(e.target.value)}
            rows={3}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand-400 dark:border-slate-700 dark:bg-slate-900"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">Concerns (one per line)</label>
          <textarea
            value={concerns}
            onChange={(e) => setConcerns(e.target.value)}
            rows={3}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand-400 dark:border-slate-700 dark:bg-slate-900"
          />
        </div>
      </div>

      {/* Additional notes */}
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-500">Additional notes</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand-400 dark:border-slate-700 dark:bg-slate-900"
        />
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2">
        <button onClick={onCancel} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700">
          Cancel
        </button>
        <button onClick={handleSave} className="flex items-center gap-1.5 rounded-xl bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700">
          <Save className="h-4 w-4" /> Save scorecard
        </button>
      </div>
    </div>
  );
}

export function ScorecardDisplay({ scorecard }: { scorecard: InterviewScorecard }) {
  const avg = Math.round(
    (scorecard.cultureFit + scorecard.technicalSkill + scorecard.communication + scorecard.problemSolving + scorecard.leadership + scorecard.overallImpression) / 6 * 20,
  );
  const rec = RECOMMENDATIONS.find((r) => r.value === scorecard.recommendation);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <div className={cn("rounded-full px-3 py-1 text-sm font-bold text-white", avg >= 80 ? "bg-emerald-500" : avg >= 60 ? "bg-amber-500" : "bg-rose-500")}>
          {avg}%
        </div>
        {rec && <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium", rec.color)}>{rec.label}</span>}
      </div>
      <div className="grid grid-cols-3 gap-2">
        {CRITERIA.map((c) => (
          <div key={c.key} className="rounded-lg bg-slate-50 p-2 text-center dark:bg-slate-800/50">
            <p className="text-[10px] text-slate-400">{c.label}</p>
            <p className="text-lg font-bold tabular-nums">{scorecard[c.key as keyof InterviewScorecard] as number}</p>
          </div>
        ))}
      </div>
      {scorecard.strengths.length > 0 && (
        <div>
          <p className="text-xs font-medium text-slate-500">Strengths</p>
          <ul className="mt-1 space-y-0.5">
            {scorecard.strengths.map((s, i) => (
              <li key={i} className="text-xs text-slate-600 dark:text-slate-300">✓ {s}</li>
            ))}
          </ul>
        </div>
      )}
      {scorecard.concerns.length > 0 && (
        <div>
          <p className="text-xs font-medium text-slate-500">Concerns</p>
          <ul className="mt-1 space-y-0.5">
            {scorecard.concerns.map((c, i) => (
              <li key={i} className="text-xs text-slate-600 dark:text-slate-300">⚠ {c}</li>
            ))}
          </ul>
        </div>
      )}
      {scorecard.additionalNotes && (
        <p className="text-xs text-slate-500 italic">{scorecard.additionalNotes}</p>
      )}
    </div>
  );
}
