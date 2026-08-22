"use client";

/**
 * Client-side workspace store.
 *
 * v1 persistence: versioned localStorage per browser ("personal workspace").
 * The interface is deliberately shaped like a repository layer so a server
 * database can replace it later without touching UI code.
 */
import { useSyncExternalStore } from "react";
import type {
  ActivityEntry,
  Candidate,
  JobRequirements,
  RecruiterNote,
  ScreeningRecord,
  ScreeningStatus,
} from "@/lib/types";

const STORAGE_KEY = "hirelens.workspace.v1";
const SCHEMA_VERSION = 1;

export interface WorkspaceState {
  jobs: JobRequirements[];
  candidates: Candidate[];
  activity: ActivityEntry[];
}

function emptyState(): WorkspaceState {
  return { jobs: [], candidates: [], activity: [] };
}

let state: WorkspaceState | null = null;
const listeners = new Set<() => void>();
let hydrated = false;

export function getState(): WorkspaceState {
  if (!hydrated) hydrate();
  return state ?? emptyState();
}

function hydrate() {
  if (typeof window === "undefined") return;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as WorkspaceState & { version?: number };
      if (parsed.version === SCHEMA_VERSION && Array.isArray(parsed.candidates)) {
        state = { jobs: parsed.jobs ?? [], candidates: parsed.candidates, activity: parsed.activity ?? [] };
      }
    }
  } catch {
    state = null;
  }
  hydrated = true;
}

function persist() {
  if (typeof window === "undefined" || !state) return;
  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ ...state, version: SCHEMA_VERSION }),
    );
  } catch {
    // Storage full / private mode — keep in-memory state working.
  }
}

function emit() {
  persist();
  for (const l of listeners) l();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  // Re-hydrate when returning to the tab (multi-tab safety).
  if (typeof document !== "undefined") {
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") {
        hydrated = false;
        listener();
      }
    });
  }
  return () => listeners.delete(listener);
}

/** React hook — re-renders whenever any part of the workspace changes. */
export function useWorkspace(): WorkspaceState {
  return useSyncExternalStore(subscribe, getState, emptyState);
}

/* ───────────────────────── Mutations ───────────────────────── */

export function upsertJobs(jobs: JobRequirements[]) {
  const s = getState();
  for (const job of jobs) {
    if (!s.jobs.some((j) => j.id === job.id)) s.jobs.unshift(job);
  }
  state = s;
  emit();
}

export function saveJob(job: JobRequirements) {
  const s = getState();
  const idx = s.jobs.findIndex((j) => j.id === job.id);
  if (idx >= 0) s.jobs[idx] = job;
  else s.jobs.unshift(job);
  s.activity.unshift({
    id: crypto.randomUUID(),
    kind: "job-created",
    message: `Saved job "${job.title}"`,
    at: new Date().toISOString(),
  });
  state = s;
  emit();
}

export function deleteJob(jobId: string) {
  const s = getState();
  state = { ...s, jobs: s.jobs.filter((j) => j.id !== jobId) };
  emit();
}

export function addScreenedCandidates(newCandidates: Candidate[], job: JobRequirements) {
  const s = getState();
  let addedCount = 0;
  let updatedCount = 0;

  for (const nc of newCandidates) {
    const existingIdx = s.candidates.findIndex(
      (c) =>
        (nc.resume.email && c.resume.email && c.resume.email === nc.resume.email) ||
        c.fileName === nc.fileName,
    );
    if (existingIdx >= 0) {
      const existing = s.candidates[existingIdx];
      const freshScreens = nc.screenings.filter(
        (ns) => !existing.screenings.some((es) => es.jobId === ns.jobId),
      );
      if (freshScreens.length > 0) {
        updatedCount++;
        s.candidates[existingIdx] = {
          ...existing,
          resume: mergeResume(existing.resume, nc.resume),
          screenings: [...existing.screenings, ...freshScreens],
          createdAt: existing.createdAt,
          fileName: existing.fileName ?? nc.fileName,
        };
      }
    } else {
      addedCount++;
      s.candidates.push(nc);
    }
  }

  s.activity.unshift({
    id: crypto.randomUUID(),
    kind: "screen",
    message: `Screened ${newCandidates.length} candidate${newCandidates.length === 1 ? "" : "s"} against "${job.title}" (${addedCount} new, ${updatedCount} updated)`,
    at: new Date().toISOString(),
  });
  s.activity = s.activity.slice(0, 60);
  state = s;
  emit();
}

function mergeResume(a: Candidate["resume"], b: Candidate["resume"]) {
  return b.skills.length >= a.skills.length ? b : a;
}

export function addNote(candidateId: string, text: string) {
  const s = getState();
  const note: RecruiterNote = { id: crypto.randomUUID(), text, createdAt: new Date().toISOString() };
  state = {
    ...s,
    candidates: s.candidates.map((c) =>
      c.id === candidateId ? { ...c, notes: [note, ...c.notes] } : c,
    ),
    activity: [
      { id: crypto.randomUUID(), kind: "note" as const, message: `Note added to candidate`, at: note.createdAt },
      ...s.activity,
    ].slice(0, 60),
  };
  emit();
}

export function deleteNote(candidateId: string, noteId: string) {
  const s = getState();
  state = {
    ...s,
    candidates: s.candidates.map((c) =>
      c.id === candidateId ? { ...c, notes: c.notes.filter((n) => n.id !== noteId) } : c,
    ),
  };
  emit();
}

const STATUSES: ScreeningStatus[] = ["new", "shortlisted", "interview", "rejected", "hired"];
export const ALL_STATUSES = STATUSES;

export function setStatus(candidateId: string, status: ScreeningStatus) {
  const s = getState();
  state = {
    ...s,
    candidates: s.candidates.map((c) => (c.id === candidateId ? { ...c, status } : c)),
    activity: [
      { id: crypto.randomUUID(), kind: "status-change" as const, message: `Candidate moved to ${status}`, at: new Date().toISOString() },
      ...s.activity.slice(0, 59),
    ],
  };
  emit();
}

export function getCandidate(id: string): Candidate | undefined {
  return getState().candidates.find((c) => c.id === id);
}

export function getJob(id: string): JobRequirements | undefined {
  return getState().jobs.find((j) => j.id === id);
}

export function resetWorkspace(demoData?: WorkspaceState) {
  state = demoData ?? emptyState();
  emit();
}

export function importScreeningResult(payload: {
  job: JobRequirements;
  results: Array<{
    fileName: string;
    resume?: Candidate["resume"];
    match?: ScreeningRecord["match"];
    aiInsight?: ScreeningRecord["aiInsight"];
    aiError?: string;
    error?: string;
  }>;
}) {
  const now = new Date().toISOString();
  const candidates: Candidate[] = [];
  for (const r of payload.results) {
    if (!r.resume || !r.match) continue;
    candidates.push({
      id: crypto.randomUUID(),
      fileName: r.fileName,
      resume: r.resume,
      notes: [],
      status: "new",
      createdAt: now,
      screenings: [
        {
          id: crypto.randomUUID(),
          jobId: payload.job.id,
          jobTitle: payload.job.title,
          match: r.match,
          aiInsight: r.aiInsight,
          aiError: r.aiError,
          createdAt: now,
        },
      ],
    });
  }
  upsertJobs([payload.job]);
  addScreenedCandidates(candidates, payload.job);
  return candidates;
}
