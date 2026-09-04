"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  ScanSearch,
  Users,
  Briefcase,
  GitCompareArrows,
  BarChart3,
  Menu,
  X,
  Eye,
  LogOut,
  Settings,
  User,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { useUser } from "@/lib/hooks/use-user";
import { signOutAction } from "@/app/actions/auth";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/screen", label: "AI Screening", icon: ScanSearch },
  { href: "/jobs", label: "Jobs", icon: Briefcase },
  { href: "/candidates", label: "Candidates", icon: Users },
  { href: "/compare", label: "Compare", icon: GitCompareArrows },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
];

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" className="focus-ring group flex items-center gap-2.5 rounded-lg" aria-label="HireLens AI home">
      <span className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-violet-600 shadow-md shadow-brand-600/30 transition-transform duration-300 group-hover:scale-105">
        <Eye className="h-5 w-5 text-white" strokeWidth={2.2} />
      </span>
      {!compact && (
        <span className="text-[17px] font-semibold tracking-tight">
          HireLens<span className="text-brand-500"> AI</span>
        </span>
      )}
    </Link>
  );
}

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col gap-1" aria-label="Main navigation">
      {NAV.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "focus-ring group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
              active
                ? "text-brand-700 dark:text-white"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/70 dark:hover:text-white",
            )}
          >
            {active && (
              <motion.span
                layoutId="nav-pill"
                className="absolute inset-0 rounded-xl bg-brand-50 ring-1 ring-inset ring-brand-600/15 dark:bg-brand-500/10 dark:ring-brand-400/20"
                transition={{ type: "spring", stiffness: 350, damping: 30 }}
              />
            )}
            <Icon className={cn("relative h-[18px] w-[18px]", active && "text-brand-600 dark:text-brand-400")} />
            <span className="relative">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

function UserMenu() {
  const { user, loading } = useUser();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  if (loading || !user) return null;

  const name = user.user_metadata?.full_name ?? user.email?.split("@")[0] ?? "User";
  const email = user.email ?? "";
  const initials = name.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="focus-ring flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-100 text-xs font-bold text-brand-700 dark:bg-brand-900/50 dark:text-brand-300">
          {initials}
        </span>
        <span className="hidden text-left text-sm font-medium text-slate-700 sm:block dark:text-slate-200">
          {name}
        </span>
        <ChevronDown className="hidden h-3.5 w-3.5 text-slate-400 sm:block" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.12 }}
            className="absolute right-0 top-full z-50 mt-1 w-56 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="border-b border-slate-100 px-4 py-3 dark:border-slate-800">
              <p className="text-sm font-medium text-slate-900 dark:text-white">{name}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{email}</p>
            </div>
            <div className="p-1.5">
              <Link
                href="/settings"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-slate-700 transition-colors hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                <Settings className="h-4 w-4 text-slate-400" /> Settings
              </Link>
              <Link
                href="/settings"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-slate-700 transition-colors hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                <User className="h-4 w-4 text-slate-400" /> Profile
              </Link>
            </div>
            <div className="border-t border-slate-100 p-1.5 dark:border-slate-800">
              <form action={signOutAction}>
                <button
                  type="submit"
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-rose-600 transition-colors hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/30"
                >
                  <LogOut className="h-4 w-4" /> Sign out
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SidebarInner({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div className="flex h-full flex-col gap-6 p-4">
      <div className="px-1 pt-1">
        <Logo />
      </div>
      <NavLinks onNavigate={onNavigate} />
      <div className="mt-auto space-y-3">
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs leading-relaxed text-slate-500 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-400">
          <p className="font-medium text-slate-700 dark:text-slate-200">Decision support</p>
          <p className="mt-1">
            Scores assist screening — the recruiter always makes the final call.
          </p>
        </div>
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => setMobileOpen(false), [pathname]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-slate-200/80 bg-white lg:block dark:border-slate-800 dark:bg-slate-900/50">
        <SidebarInner />
      </aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-sm lg:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", stiffness: 320, damping: 32 }}
              className="fixed inset-y-0 left-0 z-50 w-64 border-r border-slate-200 bg-white lg:hidden dark:border-slate-800 dark:bg-slate-900"
            >
              <button
                onClick={() => setMobileOpen(false)}
                aria-label="Close menu"
                className="focus-ring absolute right-3 top-3 rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-4 w-4" />
              </button>
              <SidebarInner onNavigate={() => setMobileOpen(false)} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Top bar */}
      <header className="glass no-print sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-slate-200/70 px-4 lg:pl-72 dark:border-slate-800/70">
        <button
          onClick={() => setMobileOpen(true)}
          aria-label="Open menu"
          className="focus-ring rounded-lg p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="lg:hidden">
          <Logo compact />
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span className="hidden items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20 sm:inline-flex dark:bg-emerald-950/50 dark:text-emerald-300 dark:ring-emerald-500/25">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
            </span>
            Workspace synced
          </span>
          <ThemeToggle />
          <UserMenu />
        </div>
      </header>

      <main className="px-4 pb-16 pt-6 sm:px-6 lg:pl-[17.5rem] lg:pr-8">{children}</main>
    </div>
  );
}
