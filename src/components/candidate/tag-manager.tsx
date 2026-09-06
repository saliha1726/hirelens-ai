"use client";

import { useState } from "react";
import { Tag, Plus, X, Palette } from "lucide-react";
import type { CandidateTag } from "@/lib/types";
import { cn } from "@/lib/utils";

const TAG_COLORS = [
  { name: "Rose", value: "#f43f5e" },
  { name: "Orange", value: "#f97316" },
  { name: "Amber", value: "#f59e0b" },
  { name: "Emerald", value: "#10b981" },
  { name: "Blue", value: "#3b82f6" },
  { name: "Violet", value: "#8b5cf6" },
  { name: "Pink", value: "#ec4899" },
  { name: "Teal", value: "#14b8a6" },
  { name: "Indigo", value: "#6366f1" },
  { name: "Slate", value: "#64748b" },
];

export function TagManager({
  tags,
  onAdd,
  onRemove,
  readonly,
}: {
  tags: CandidateTag[];
  onAdd: (tag: CandidateTag) => void;
  onRemove: (tagId: string) => void;
  readonly?: boolean;
}) {
  const [showPicker, setShowPicker] = useState(false);
  const [newTagName, setNewTagName] = useState("");
  const [newTagColor, setNewTagColor] = useState(TAG_COLORS[0].value);

  function handleCreate() {
    if (!newTagName.trim()) return;
    onAdd({ id: crypto.randomUUID(), name: newTagName.trim(), color: newTagColor });
    setNewTagName("");
    setShowPicker(false);
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {tags.map((tag) => (
        <span
          key={tag.id}
          className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium text-white"
          style={{ backgroundColor: tag.color }}
        >
          {tag.name}
          {!readonly && (
            <button onClick={() => onRemove(tag.id)} className="ml-0.5 hover:opacity-70">
              <X className="h-3 w-3" />
            </button>
          )}
        </span>
      ))}

      {!readonly && (showPicker ? (
        <div className="relative">
          <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white p-2 shadow-lg dark:border-slate-700 dark:bg-slate-900">
            <input
              autoFocus
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              placeholder="Tag name"
              className="w-24 rounded-lg border-none bg-transparent text-xs outline-none"
            />
            <div className="flex gap-0.5">
              {TAG_COLORS.slice(0, 5).map((c) => (
                <button
                  key={c.value}
                  onClick={() => setNewTagColor(c.value)}
                  className={cn(
                    "h-4 w-4 rounded-full transition-transform",
                    newTagColor === c.value && "scale-125 ring-2 ring-offset-1 ring-slate-400",
                  )}
                  style={{ backgroundColor: c.value }}
                />
              ))}
            </div>
            <button onClick={handleCreate} className="rounded-lg bg-brand-600 px-2 py-0.5 text-[10px] font-medium text-white hover:bg-brand-700">
              Add
            </button>
            <button onClick={() => setShowPicker(false)} className="rounded-lg px-1.5 py-0.5 text-[10px] text-slate-400 hover:text-slate-600">
              <X className="h-3 w-3" />
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowPicker(true)}
          className="inline-flex items-center gap-0.5 rounded-full border border-dashed border-slate-300 px-2 py-0.5 text-xs text-slate-400 transition-colors hover:border-brand-400 hover:text-brand-500 dark:border-slate-600"
        >
          <Plus className="h-3 w-3" /> Tag
        </button>
      ))}
      </div>
  );
}
