"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Keyboard } from "lucide-react";

const SHORTCUTS = [
  { keys: ["Ctrl", "K"], label: "Open command palette / global search" },
  { keys: ["Ctrl", "1-7"], label: "Navigate to nav items" },
  { keys: ["?"], label: "Show this shortcuts guide" },
  { keys: ["Esc"], label: "Close modals / command palette" },
  { keys: ["Enter"], label: "Confirm action in modals" },
  { keys: ["↑", "↓"], label: "Navigate command palette results" },
];

export function ShortcutsGuide() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "?" && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const target = e.target as HTMLElement;
        if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) return;
        e.preventDefault();
        setOpen((prev) => !prev);
      }
      if (e.key === "Escape" && open) {
        setOpen(false);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] bg-black/40 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -10 }}
            transition={{ duration: 0.15 }}
            className="fixed left-1/2 top-[25%] z-[71] w-full max-w-md -translate-x-1/2 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900"
          >
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-700">
              <div className="flex items-center gap-2">
                <Keyboard className="h-5 w-5 text-brand-500" />
                <h2 className="text-sm font-semibold">Keyboard Shortcuts</h2>
              </div>
              <button onClick={() => setOpen(false)} className="rounded-lg p-1 text-slate-400 hover:text-slate-600">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-5">
              <div className="space-y-3">
                {SHORTCUTS.map((s, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <span className="text-sm text-slate-600 dark:text-slate-300">{s.label}</span>
                    <div className="flex gap-1">
                      {s.keys.map((k) => (
                        <kbd key={k} className="rounded-md border border-slate-200 bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300">
                          {k}
                        </kbd>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-center text-[10px] text-slate-400">Press <kbd className="rounded border border-slate-200 bg-slate-100 px-1 py-0.5 text-[9px] dark:border-slate-600 dark:bg-slate-800">?</kbd> anywhere to toggle</p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
