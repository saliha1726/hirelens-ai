import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return formatDate(iso);
}

export type ScoreTone = "high" | "good" | "fair" | "low";

export function scoreTone(score: number): ScoreTone {
  if (score >= 80) return "high";
  if (score >= 65) return "good";
  if (score >= 45) return "fair";
  return "low";
}

export const TONE_STYLES: Record<ScoreTone, { text: string; bg: string; stroke: string; label: string }> = {
  high: { text: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-500", stroke: "#10b981", label: "Strong match" },
  good: { text: "text-brand-600 dark:text-brand-400", bg: "bg-brand-500", stroke: "#3b6bf6", label: "Good match" },
  fair: { text: "text-amber-600 dark:text-amber-400", bg: "bg-amber-500", stroke: "#f59e0b", label: "Fair match" },
  low: { text: "text-rose-600 dark:text-rose-400", bg: "bg-rose-500", stroke: "#f43f5e", label: "Weak match" },
};

export function initialsOf(name?: string, fallback = "?"): string {
  if (!name) return fallback;
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() ?? "").join("") || fallback;
}

export function titleCaseName(fileName?: string): string {
  if (!fileName) return "Unknown candidate";
  const base = fileName.replace(/\.[a-z]+$/i, "").replace(/[_-]+/g, " ").trim();
  return base
    .split(" ")
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
