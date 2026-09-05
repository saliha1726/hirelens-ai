"use client";

import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Users,
  Briefcase,
  LayoutDashboard,
  ScanSearch,
  Columns3,
  GitCompareArrows,
  BarChart3,
  Settings,
  ArrowRight,
  FileText,
  Moon,
  Sun,
} from "lucide-react";
import { useWorkspace } from "@/lib/client/store";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import { initialsOf, titleCaseName } from "@/lib/utils";

interface CommandItem {
  id: string;
  label: string;
  description?: string;
  icon: React.ComponentType<{ className?: string }>;
  action: () => void;
  category: "navigation" | "candidates" | "jobs" | "actions";
}

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const ws = useWorkspace();
  const { resolvedTheme, setTheme } = useTheme();

  const navigate = useCallback(
    (href: string) => {
      setOpen(false);
      setQuery("");
      router.push(href);
    },
    [router],
  );

  const items: CommandItem[] = useMemo(() => {
    const nav: CommandItem[] = [
      { id: "nav-dashboard", label: "Dashboard", icon: LayoutDashboard, action: () => navigate("/dashboard"), category: "navigation" },
      { id: "nav-screen", label: "AI Screening", icon: ScanSearch, action: () => navigate("/screen"), category: "navigation" },
      { id: "nav-jobs", label: "Jobs", icon: Briefcase, action: () => navigate("/jobs"), category: "navigation" },
      { id: "nav-candidates", label: "Candidates", icon: Users, action: () => navigate("/candidates"), category: "navigation" },
      { id: "nav-pipeline", label: "Pipeline", icon: Columns3, action: () => navigate("/pipeline"), category: "navigation" },
      { id: "nav-compare", label: "Compare", icon: GitCompareArrows, action: () => navigate("/compare"), category: "navigation" },
      { id: "nav-analytics", label: "Analytics", icon: BarChart3, action: () => navigate("/analytics"), category: "navigation" },
      { id: "nav-settings", label: "Settings", icon: Settings, action: () => navigate("/settings"), category: "navigation" },
    ];

    const candidateItems: CommandItem[] = ws.candidates.map((c) => ({
      id: `candidate-${c.id}`,
      label: c.resume.name ?? titleCaseName(c.fileName ?? "Unknown"),
      description: c.screenings.length ? `${c.screenings.length} screening(s) · ${c.status}` : c.status,
      icon: Users,
      action: () => navigate(`/candidates/${c.id}`),
      category: "candidates" as const,
    }));

    const jobItems: CommandItem[] = ws.jobs.map((j) => ({
      id: `job-${j.id}`,
      label: j.title,
      description: j.company ? `${j.company} · ${j.requiredSkills.length} skills` : `${j.requiredSkills.length} skills`,
      icon: Briefcase,
      action: () => navigate(`/jobs/${j.id}`),
      category: "jobs" as const,
    }));

    const actions: CommandItem[] = [
      {
        id: "action-theme",
        label: `Switch to ${resolvedTheme === "dark" ? "light" : "dark"} mode`,
        icon: resolvedTheme === "dark" ? Sun : Moon,
        action: () => setTheme(resolvedTheme === "dark" ? "light" : "dark"),
        category: "actions",
      },
    ];

    return [...nav, ...candidateItems, ...jobItems, ...actions];
  }, [ws, navigate, resolvedTheme, setTheme]);

  const filtered = useMemo(() => {
    if (!query.trim()) return items;
    const q = query.toLowerCase();
    return items.filter(
      (item) =>
        item.label.toLowerCase().includes(q) ||
        (item.description && item.description.toLowerCase().includes(q)),
    );
  }, [items, query]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
        setQuery("");
      }
      if (e.key === "Escape") {
        setOpen(false);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && filtered[selectedIndex]) {
      e.preventDefault();
      filtered[selectedIndex].action();
    }
  }

  const categories = useMemo(() => {
    const groups: { label: string; items: CommandItem[] }[] = [];
    const navItems = filtered.filter((i) => i.category === "navigation");
    const candidateItems = filtered.filter((i) => i.category === "candidates");
    const jobItems = filtered.filter((i) => i.category === "jobs");
    const actionItems = filtered.filter((i) => i.category === "actions");

    if (navItems.length) groups.push({ label: "Navigation", items: navItems });
    if (candidateItems.length) groups.push({ label: "Candidates", items: candidateItems });
    if (jobItems.length) groups.push({ label: "Jobs", items: jobItems });
    if (actionItems.length) groups.push({ label: "Actions", items: actionItems });
    return groups;
  }, [filtered]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -10 }}
            transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
            className="fixed left-1/2 top-[20%] z-[61] w-full max-w-lg -translate-x-1/2 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900"
          >
            <div className="flex items-center gap-3 border-b border-slate-200 px-4 dark:border-slate-700">
              <Search className="h-4 w-4 shrink-0 text-slate-400" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search candidates, jobs, or commands..."
                className="h-12 flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400"
              />
              <kbd className="hidden rounded-md border border-slate-200 bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500 dark:border-slate-600 dark:bg-slate-800 sm:inline">
                ESC
              </kbd>
            </div>

            <div className="max-h-[60vh] overflow-y-auto p-2">
              {filtered.length === 0 && (
                <p className="py-6 text-center text-sm text-slate-400">No results found.</p>
              )}

              {categories.map((group) => {
                let globalIdx = -1;
                return (
                  <div key={group.label} className="mb-1">
                    <p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                      {group.label}
                    </p>
                    {group.items.map((item) => {
                      globalIdx = filtered.indexOf(item);
                      const isActive = globalIdx === selectedIndex;
                      return (
                        <button
                          key={item.id}
                          onClick={item.action}
                          onMouseEnter={() => setSelectedIndex(globalIdx)}
                          className={cn(
                            "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-colors",
                            isActive
                              ? "bg-brand-50 text-brand-700 dark:bg-brand-950/50 dark:text-brand-300"
                              : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800",
                          )}
                        >
                          <item.icon className="h-4 w-4 shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-medium">{item.label}</p>
                            {item.description && (
                              <p className="truncate text-xs text-slate-400">{item.description}</p>
                            )}
                          </div>
                          {isActive && <ArrowRight className="h-3.5 w-3.5 shrink-0 text-brand-500" />}
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-between border-t border-slate-200 px-4 py-2 text-[10px] text-slate-400 dark:border-slate-700">
              <span>↑↓ navigate · ↵ select · esc close</span>
              <span>Ctrl+K to toggle</span>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
