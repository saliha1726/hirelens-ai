"use client";

import { useState } from "react";
import { ClipboardCheck, Plus, Check, Circle, Trash2, Calendar } from "lucide-react";
import type { OnboardingTask, OnboardingTaskStatus } from "@/lib/types";
import { cn, formatDate } from "@/lib/utils";

const STATUS_ICON: Record<OnboardingTaskStatus, React.ComponentType<{ className?: string }>> = {
  pending: Circle,
  "in-progress": ClipboardCheck,
  completed: Check,
};

const STATUS_COLORS: Record<OnboardingTaskStatus, string> = {
  pending: "text-slate-400 border-slate-300",
  "in-progress": "text-blue-500 border-blue-400",
  completed: "text-emerald-500 border-emerald-400 bg-emerald-50 dark:bg-emerald-950/30",
};

export function OnboardingChecklist({
  tasks,
  onAdd,
  onUpdate,
  onDelete,
}: {
  tasks: OnboardingTask[];
  onAdd: (task: Omit<OnboardingTask, "id" | "createdAt">) => void;
  onUpdate: (task: OnboardingTask) => void;
  onDelete: (taskId: string) => void;
}) {
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");

  const sorted = [...tasks].sort((a, b) => {
    if (a.status === "completed" && b.status !== "completed") return 1;
    if (a.status !== "completed" && b.status === "completed") return -1;
    if (a.dueDate && b.dueDate) return a.dueDate.localeCompare(b.dueDate);
    if (a.dueDate) return -1;
    if (b.dueDate) return 1;
    return 0;
  });

  const completedCount = tasks.filter((t) => t.status === "completed").length;
  const progress = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

  function handleAdd() {
    if (!title.trim()) return;
    onAdd({
      candidateId: "",
      title: title.trim(),
      description: description.trim() || undefined,
      status: "pending",
      dueDate: dueDate || undefined,
    });
    setTitle("");
    setDescription("");
    setDueDate("");
    setShowForm(false);
  }

  function cycleStatus(task: OnboardingTask) {
    const next: OnboardingTaskStatus =
      task.status === "pending" ? "in-progress" : task.status === "in-progress" ? "completed" : "pending";
    onUpdate({ ...task, status: next, completedAt: next === "completed" ? new Date().toISOString() : undefined });
  }

  return (
    <div>
      {tasks.length > 0 && (
        <div className="mb-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500">{completedCount}/{tasks.length} completed</span>
            <span className="font-medium tabular-nums text-brand-600">{progress}%</span>
          </div>
          <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
            <div className="h-full rounded-full bg-brand-500 transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}

      <div className="space-y-1.5">
        {sorted.map((task) => {
          const Icon = STATUS_ICON[task.status];
          const isOverdue = task.dueDate && task.status !== "completed" && new Date(task.dueDate) < new Date();
          return (
            <div key={task.id} className={cn("group flex items-start gap-2.5 rounded-xl p-2.5 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50", task.status === "completed" && "opacity-60")}>
              <button onClick={() => cycleStatus(task)} className={cn("mt-0.5 rounded-full border-2 p-0.5 transition-colors", STATUS_COLORS[task.status])}>
                <Icon className="h-3 w-3" />
              </button>
              <div className="min-w-0 flex-1">
                <p className={cn("text-sm font-medium", task.status === "completed" && "line-through text-slate-400")}>{task.title}</p>
                {task.description && <p className="text-xs text-slate-400">{task.description}</p>}
                {task.dueDate && (
                  <span className={cn("mt-0.5 inline-flex items-center gap-1 text-[10px]", isOverdue ? "font-medium text-rose-500" : "text-slate-400")}>
                    <Calendar className="h-2.5 w-2.5" /> {formatDate(task.dueDate)}{isOverdue && " (overdue)"}
                  </span>
                )}
              </div>
              <button onClick={() => onDelete(task.id)} className="shrink-0 rounded-lg p-1 text-slate-300 opacity-0 transition-opacity hover:text-rose-500 group-hover:opacity-100">
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          );
        })}
      </div>

      {showForm ? (
        <div className="mt-3 rounded-xl border border-brand-200 bg-brand-50/30 p-3 dark:border-brand-800">
          <input autoFocus value={title} onChange={(e) => setTitle(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleAdd()} placeholder="Task title" className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm outline-none focus:border-brand-400 dark:border-slate-700 dark:bg-slate-900" />
          <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description (optional)" className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm outline-none focus:border-brand-400 dark:border-slate-700 dark:bg-slate-900" />
          <div className="mt-2 flex items-center gap-2">
            <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-900" />
            <button onClick={handleAdd} disabled={!title.trim()} className="ml-auto rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-700 disabled:opacity-40">Add task</button>
            <button onClick={() => setShowForm(false)} className="rounded-lg px-2 py-1.5 text-xs text-slate-400">Cancel</button>
          </div>
        </div>
      ) : (
        <button onClick={() => setShowForm(true)} className="mt-2 flex w-full items-center justify-center gap-1 rounded-xl border border-dashed border-slate-300 py-2 text-xs text-slate-400 transition-colors hover:border-brand-400 hover:text-brand-500">
          <Plus className="h-3 w-3" /> Add task
        </button>
      )}
    </div>
  );
}
