"use client";

import { useCallback, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FileText, UploadCloud, X } from "lucide-react";
import { cn, formatBytes } from "@/lib/utils";

export interface PendingFile {
  file: File;
  id: string;
  error?: string;
}

const ALLOWED = [".pdf", ".docx", ".txt", ".md"];
const MAX_MB = 5;

function validate(file: File): string | undefined {
  const ext = `.${file.name.toLowerCase().split(".").pop()}`;
  if (!ALLOWED.includes(ext)) return "Unsupported type";
  if (file.size === 0) return "Empty file";
  if (file.size > MAX_MB * 1024 * 1024) return `Over ${MAX_MB} MB`;
  return undefined;
}

export function ResumeDropzone({
  files,
  onChange,
  disabled,
}: {
  files: PendingFile[];
  onChange: (files: PendingFile[]) => void;
  disabled?: boolean;
}) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const addFiles = useCallback(
    (incoming: FileList | File[]) => {
      const mapped: PendingFile[] = Array.from(incoming).map((f) => ({
        file: f,
        id: `${f.name}-${f.size}-${Math.random().toString(36).slice(2)}`,
        error: validate(f),
      }));
      onChange([...files, ...mapped].slice(0, 10));
    },
    [files, onChange],
  );

  return (
    <div>
      <div
        role="button"
        tabIndex={0}
        aria-label="Upload resume files"
        onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
        onClick={() => !disabled && inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          if (!disabled) addFiles(e.dataTransfer.files);
        }}
        className={cn(
          "focus-ring flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 text-center transition-all duration-300",
          dragging
            ? "border-brand-500 bg-brand-50/70 scale-[1.01] dark:bg-brand-950/40"
            : "border-slate-300 bg-slate-50/50 hover:border-brand-400 hover:bg-brand-50/30 dark:border-slate-700 dark:bg-slate-900/50 dark:hover:border-brand-500",
          disabled && "pointer-events-none opacity-60",
        )}
      >
        <motion.span
          animate={dragging ? { y: -4, scale: 1.08 } : { y: 0, scale: 1 }}
          className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-violet-600 text-white shadow-lg shadow-brand-600/25"
        >
          <UploadCloud className="h-6 w-6" />
        </motion.span>
        <p className="text-sm font-medium">
          Drop resumes here or <span className="text-brand-600 underline underline-offset-2">browse</span>
        </p>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          PDF, DOCX or TXT · up to {MAX_MB} MB each · max 10 files per run
        </p>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".pdf,.docx,.txt,.md,application/pdf"
          className="hidden"
          onChange={(e) => {
            if (e.target.files) addFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      <AnimatePresence>
        {files.length > 0 && (
          <motion.ul initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 space-y-2">
            {files.map((pf) => (
              <motion.li
                key={pf.id}
                layout
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 8 }}
                className={cn(
                  "flex items-center gap-3 rounded-xl border px-3 py-2.5 text-sm",
                  pf.error
                    ? "border-rose-200 bg-rose-50 dark:border-rose-500/30 dark:bg-rose-950/30"
                    : "border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900",
                )}
              >
                <FileText className={cn("h-4 w-4 shrink-0", pf.error ? "text-rose-500" : "text-brand-500")} />
                <span className="min-w-0 flex-1 truncate font-medium">{pf.file.name}</span>
                <span className={cn("shrink-0 text-xs", pf.error ? "font-medium text-rose-600 dark:text-rose-300" : "text-slate-400")}>
                  {pf.error ?? formatBytes(pf.file.size)}
                </span>
                <button
                  type="button"
                  onClick={() => onChange(files.filter((x) => x.id !== pf.id))}
                  className="focus-ring rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-rose-500 dark:hover:bg-slate-800"
                  aria-label={`Remove ${pf.file.name}`}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </motion.li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}
