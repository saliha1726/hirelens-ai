"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Check, Building2 } from "lucide-react";
import { useUser } from "@/lib/hooks/use-user";
import { getUserWorkspaces } from "@/lib/workspace";
import { getActiveWorkspaceId, setActiveWorkspace } from "@/lib/client/store";
import { cn } from "@/lib/utils";
import type { WorkspaceRole } from "@/lib/types";

interface WorkspaceItem {
  wsId: string;
  name: string;
  role: WorkspaceRole;
}

export function WorkspaceSwitcher() {
  const { user } = useUser();
  const [workspaces, setWorkspaces] = useState<WorkspaceItem[]>([]);
  const [open, setOpen] = useState(false);
  const [activeWs, setActiveWs] = useState<string>("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    // Set initial active workspace
    const current = getActiveWorkspaceId();
    setActiveWs(current ?? user.uid);

    getUserWorkspaces().then((ws) => {
      setWorkspaces(ws);
    });
  }, [user]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  if (!user) return null;

  const currentName = workspaces.find((w) => w.wsId === activeWs)?.name ?? "Personal workspace";
  const isPersonal = activeWs === user.uid;

  function switchTo(wsId: string) {
    setActiveWorkspace(wsId);
    setActiveWs(wsId);
    setOpen(false);
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="focus-ring flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium transition-colors hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
      >
        <Building2 className="h-4 w-4 text-brand-500" />
        <span className="hidden max-w-[140px] truncate sm:block">{currentName}</span>
        <ChevronDown className={cn("h-3.5 w-3.5 text-slate-400 transition-transform", open && "rotate-180")} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.12 }}
            className="absolute right-0 top-full z-50 mt-1 w-64 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="border-b border-slate-100 px-4 py-2.5 dark:border-slate-800">
              <p className="text-xs font-medium text-slate-400">Switch workspace</p>
            </div>
            <div className="p-1.5">
              {/* Personal workspace */}
              <button
                onClick={() => switchTo(user.uid)}
                className={cn(
                  "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors",
                  isPersonal
                    ? "bg-brand-50 text-brand-700 dark:bg-brand-950/40 dark:text-brand-300"
                    : "text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800",
                )}
              >
                {isPersonal && <Check className="h-4 w-4 shrink-0" />}
                <span className="truncate">Personal workspace</span>
              </button>

              {/* Team workspaces */}
              {workspaces.map((ws) => (
                <button
                  key={ws.wsId}
                  onClick={() => switchTo(ws.wsId)}
                  className={cn(
                    "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors",
                    ws.wsId === activeWs
                      ? "bg-brand-50 text-brand-700 dark:bg-brand-950/40 dark:text-brand-300"
                      : "text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800",
                  )}
                >
                  {ws.wsId === activeWs && <Check className="h-4 w-4 shrink-0" />}
                  <span className="truncate">{ws.name}</span>
                  <span className="ml-auto shrink-0 text-[10px] text-slate-400">{ws.role}</span>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
