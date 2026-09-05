"use client";

import { useState } from "react";
import { Pin, PinOff, Trash2, Edit3, Check, X, MessageSquare, User, Mic, BarChart3 } from "lucide-react";
import type { RecruiterNote } from "@/lib/types";
import { cn, timeAgo } from "@/lib/utils";

const NOTE_TYPES = [
  { value: "general", label: "General", icon: MessageSquare, color: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300" },
  { value: "interview", label: "Interview", icon: Mic, color: "bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400" },
  { value: "feedback", label: "Feedback", icon: User, color: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400" },
  { value: "screening", label: "Screening", icon: BarChart3, color: "bg-violet-50 text-violet-600 dark:bg-violet-950/50 dark:text-violet-400" },
] as const;

export function RichNotes({
  notes,
  onAdd,
  onEdit,
  onDelete,
  onTogglePin,
}: {
  notes: RecruiterNote[];
  onAdd: (text: string, type: RecruiterNote["type"]) => void;
  onEdit: (noteId: string, text: string) => void;
  onDelete: (noteId: string) => void;
  onTogglePin: (noteId: string) => void;
}) {
  const [text, setText] = useState("");
  const [type, setType] = useState<RecruiterNote["type"]>("general");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");

  const sorted = [...notes].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  function handleAdd() {
    if (!text.trim()) return;
    onAdd(text.trim(), type);
    setText("");
  }

  function handleEdit(noteId: string) {
    if (!editText.trim()) return;
    onEdit(noteId, editText.trim());
    setEditingId(null);
    setEditText("");
  }

  return (
    <div>
      <div className="flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          placeholder="Add a note..."
          className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-brand-400 dark:border-slate-700 dark:bg-slate-900"
        />
        <select
          value={type}
          onChange={(e) => setType(e.target.value as RecruiterNote["type"])}
          className="rounded-xl border border-slate-200 bg-white px-2 py-2 text-xs dark:border-slate-700 dark:bg-slate-900"
        >
          {NOTE_TYPES.map((nt) => (
            <option key={nt.value} value={nt.value}>{nt.label}</option>
          ))}
        </select>
        <button
          onClick={handleAdd}
          disabled={!text.trim()}
          className="rounded-xl bg-brand-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-700 disabled:opacity-40"
        >
          Add
        </button>
      </div>

      <div className="mt-3 space-y-2">
        {sorted.length === 0 && (
          <p className="py-4 text-center text-sm text-slate-400">No notes yet. Add one above.</p>
        )}
        {sorted.map((note) => {
          const typeInfo = NOTE_TYPES.find((t) => t.value === note.type) ?? NOTE_TYPES[0];
          const TypeIcon = typeInfo.icon;
          const isEditing = editingId === note.id;

          return (
            <div
              key={note.id}
              className={cn(
                "group rounded-xl border p-3 transition-all",
                note.pinned
                  ? "border-brand-200 bg-brand-50/50 dark:border-brand-800 dark:bg-brand-950/20"
                  : "border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900",
              )}
            >
              <div className="flex items-start gap-2">
                <span className={cn("mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md", typeInfo.color)}>
                  <TypeIcon className="h-3 w-3" />
                </span>
                <div className="min-w-0 flex-1">
                  {isEditing ? (
                    <div className="flex gap-1.5">
                      <input
                        autoFocus
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleEdit(note.id)}
                        className="flex-1 rounded-lg border border-brand-300 bg-white px-2 py-1 text-sm outline-none dark:border-brand-700 dark:bg-slate-800"
                      />
                      <button onClick={() => handleEdit(note.id)} className="rounded-lg bg-brand-600 p-1 text-white hover:bg-brand-700">
                        <Check className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => setEditingId(null)} className="rounded-lg p-1 text-slate-400 hover:text-slate-600">
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ) : (
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{note.text}</p>
                  )}
                  <div className="mt-1.5 flex items-center gap-2 text-[10px] text-slate-400">
                    <span>{timeAgo(note.createdAt)}</span>
                    <span className="capitalize">{note.type}</span>
                    {note.updatedAt && <span>(edited)</span>}
                  </div>
                </div>
                {!isEditing && (
                  <div className="flex shrink-0 gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                    <button
                      onClick={() => onTogglePin(note.id)}
                      className="rounded-lg p-1 text-slate-300 hover:bg-slate-100 hover:text-brand-500 dark:hover:bg-slate-800"
                      title={note.pinned ? "Unpin" : "Pin"}
                    >
                      {note.pinned ? <PinOff className="h-3.5 w-3.5" /> : <Pin className="h-3.5 w-3.5" />}
                    </button>
                    <button
                      onClick={() => { setEditingId(note.id); setEditText(note.text); }}
                      className="rounded-lg p-1 text-slate-300 hover:bg-slate-100 hover:text-blue-500 dark:hover:bg-slate-800"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => onDelete(note.id)}
                      className="rounded-lg p-1 text-slate-300 hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-rose-950/40"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
