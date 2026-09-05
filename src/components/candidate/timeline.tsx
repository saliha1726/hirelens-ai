"use client";

import { useMemo } from "react";
import { Clock, ArrowRight, MessageSquare, Tag, Mic, FileText } from "lucide-react";
import type { Candidate, ScreeningStatus } from "@/lib/types";
import { cn, timeAgo } from "@/lib/utils";

interface TimelineEntry {
  id: string;
  kind: "screening" | "status-change" | "note" | "interview" | "tag";
  message: string;
  at: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

const STATUS_COLORS: Record<ScreeningStatus, string> = {
  new: "bg-slate-400",
  screening: "bg-blue-500",
  shortlisted: "bg-emerald-500",
  interview: "bg-violet-500",
  hired: "bg-green-500",
  rejected: "bg-rose-500",
};

export function CandidateTimeline({ candidate }: { candidate: Candidate }) {
  const entries = useMemo(() => {
    const items: TimelineEntry[] = [];

    for (const s of candidate.screenings) {
      items.push({
        id: s.id,
        kind: "screening",
        message: `Screened against "${s.jobTitle}" — scored ${s.match.overallScore}%`,
        at: s.createdAt,
        icon: FileText,
        color: "bg-brand-500",
      });
    }

    for (const n of candidate.notes) {
      items.push({
        id: n.id,
        kind: "note",
        message: n.text.length > 80 ? n.text.slice(0, 80) + "..." : n.text,
        at: n.createdAt,
        icon: MessageSquare,
        color: "bg-slate-400",
      });
    }

    for (const i of candidate.interviews) {
      items.push({
        id: i.id,
        kind: "interview",
        message: `${i.type} interview scheduled — ${i.duration}min${i.scorecard ? " (scored)" : ""}`,
        at: i.createdAt,
        icon: Mic,
        color: "bg-violet-500",
      });
    }

    if (candidate.tags.length > 0) {
      items.push({
        id: `tags-${candidate.id}`,
        kind: "tag",
        message: `Tagged: ${candidate.tags.map((t) => t.name).join(", ")}`,
        at: candidate.createdAt,
        icon: Tag,
        color: "bg-pink-500",
      });
    }

    items.push({
      id: `created-${candidate.id}`,
      kind: "status-change",
      message: "Candidate added",
      at: candidate.createdAt,
      icon: Clock,
      color: "bg-slate-300",
    });

    return items.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
  }, [candidate]);

  if (entries.length === 0) {
    return <p className="py-4 text-center text-sm text-slate-400">No activity yet.</p>;
  }

  return (
    <div className="relative ml-3 border-l-2 border-slate-200 pl-6 dark:border-slate-700">
      {entries.map((entry, i) => {
        const Icon = entry.icon;
        return (
          <div key={entry.id} className="relative pb-6 last:pb-0">
            <span className={cn("absolute -left-[31px] top-0 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white dark:border-slate-900", entry.color)}>
              <Icon className="h-2.5 w-2.5 text-white" />
            </span>
            <div>
              <p className="text-sm leading-relaxed">{entry.message}</p>
              <p className="mt-0.5 text-[11px] text-slate-400">{timeAgo(entry.at)}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
