"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, ScanSearch, Briefcase, Users, Columns3 } from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/screen", label: "Screen", icon: ScanSearch },
  { href: "/jobs", label: "Jobs", icon: Briefcase },
  { href: "/candidates", label: "People", icon: Users },
  { href: "/pipeline", label: "Pipeline", icon: Columns3 },
];

export function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-200 bg-white/90 backdrop-blur-lg dark:border-slate-800 dark:bg-slate-950/90 lg:hidden">
      <div className="flex items-center justify-around px-2 py-1.5">
        {TABS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-col items-center gap-0.5 rounded-xl px-3 py-1.5 text-[10px] font-medium transition-colors",
                active
                  ? "text-brand-600 dark:text-brand-400"
                  : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300",
              )}
            >
              <Icon className={cn("h-5 w-5", active && "text-brand-600 dark:text-brand-400")} />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
