"use client";

import { useState } from "react";
import { CalendarDays, Clock, Video, Phone, Building2, Code, Plus, Trash2 } from "lucide-react";
import type { Candidate, Interview } from "@/lib/types";
import { useWorkspace, updateCandidate } from "@/lib/client/store";
import { Card, CardContent, Button } from "@/components/ui/primitives";
import { cn, formatDate } from "@/lib/utils";

const INTERVIEW_TYPES = [
  { value: "phone", label: "Phone", icon: Phone, color: "bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400" },
  { value: "video", label: "Video", icon: Video, color: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400" },
  { value: "onsite", label: "On-site", icon: Building2, color: "bg-violet-50 text-violet-600 dark:bg-violet-950/50 dark:text-violet-400" },
  { value: "technical", label: "Technical", icon: Code, color: "bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400" },
] as const;

const DURATIONS = [15, 30, 45, 60, 90, 120];

export function InterviewScheduler({ candidate }: { candidate: Candidate }) {
  const ws = useWorkspace();
  const [showForm, setShowForm] = useState(false);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("10:00");
  const [duration, setDuration] = useState(60);
  const [type, setType] = useState<Interview["type"]>("video");
  const [notes, setNotes] = useState("");

  const interviews = candidate.interviews ?? [];
  const upcoming = interviews
    .filter((i) => new Date(i.scheduledAt) >= new Date())
    .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());
  const past = interviews
    .filter((i) => new Date(i.scheduledAt) < new Date())
    .sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime());

  function handleSchedule() {
    if (!date || !time) return;
    const scheduledAt = new Date(`${date}T${time}`).toISOString();
    const newInterview: Interview = {
      id: crypto.randomUUID(),
      scheduledAt,
      duration,
      type,
      notes: notes.trim() || undefined,
      createdAt: new Date().toISOString(),
    };
    updateCandidate({ ...candidate, interviews: [...interviews, newInterview] });
    setShowForm(false);
    setDate("");
    setTime("10:00");
    setDuration(60);
    setType("video");
    setNotes("");
  }

  function handleDelete(id: string) {
    updateCandidate({ ...candidate, interviews: interviews.filter((i) => i.id !== id) });
  }

  return (
    <Card>
      <CardContent className="pt-5">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Interviews</h3>
          <Button size="sm" variant="outline" onClick={() => setShowForm(!showForm)}>
            <Plus className="h-3.5 w-3.5 mr-1" /> Schedule
          </Button>
        </div>

        {showForm && (
          <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/50">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-500">Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-500">Time</label>
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-500">Duration</label>
                <select
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
                >
                  {DURATIONS.map((d) => (
                    <option key={d} value={d}>{d} min</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-500">Type</label>
                <div className="flex gap-1.5">
                  {INTERVIEW_TYPES.map((t) => {
                    const Icon = t.icon;
                    return (
                      <button
                        key={t.value}
                        onClick={() => setType(t.value)}
                        className={cn(
                          "flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors",
                          type === t.value ? t.color : "bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700",
                        )}
                      >
                        <Icon className="h-3 w-3" />
                        {t.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
            <div className="mt-3">
              <label className="mb-1 block text-xs font-medium text-slate-500">Notes (optional)</label>
              <input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Interview focus areas, questions..."
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
              />
            </div>
            <div className="mt-3 flex justify-end gap-2">
              <Button size="sm" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button size="sm" onClick={handleSchedule} disabled={!date}>Schedule interview</Button>
            </div>
          </div>
        )}

        {interviews.length === 0 && !showForm && (
          <p className="mt-3 text-sm text-slate-400">No interviews scheduled yet.</p>
        )}

        {upcoming.length > 0 && (
          <div className="mt-3 space-y-2">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Upcoming</p>
            {upcoming.map((interview) => (
              <InterviewRow key={interview.id} interview={interview} onDelete={handleDelete} />
            ))}
          </div>
        )}

        {past.length > 0 && (
          <div className="mt-3 space-y-2">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Past</p>
            {past.map((interview) => (
              <InterviewRow key={interview.id} interview={interview} onDelete={handleDelete} isPast />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function InterviewRow({
  interview,
  onDelete,
  isPast,
}: {
  interview: Interview;
  onDelete: (id: string) => void;
  isPast?: boolean;
}) {
  const typeInfo = INTERVIEW_TYPES.find((t) => t.value === interview.type) ?? INTERVIEW_TYPES[1];
  const Icon = typeInfo.icon;
  const date = new Date(interview.scheduledAt);

  return (
    <div className={cn(
      "flex items-center gap-3 rounded-xl border p-3 transition-colors",
      isPast
        ? "border-slate-200 bg-slate-50/50 opacity-60 dark:border-slate-800 dark:bg-slate-900/30"
        : "border-slate-200 bg-white hover:border-brand-200 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-brand-700",
    )}>
      <span className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg", typeInfo.color)}>
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">
          {date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
          {" at "}
          {date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
        </p>
        <p className="text-xs text-slate-400">
          {interview.duration} min · {typeInfo.label}
          {interview.notes ? ` · ${interview.notes}` : ""}
        </p>
      </div>
      <button
        onClick={() => onDelete(interview.id)}
        className="rounded-lg p-1.5 text-slate-300 transition-colors hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-rose-950/40"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
