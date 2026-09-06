"use client";

/**
 * Client-side workspace store.
 *
 * Persistence: Firestore per-user workspace (Firestore free tier).
 * All mutations write to Firestore AND update in-memory state optimistically.
 * Real-time listeners keep multi-tab and cross-device state in sync.
 *
 * The public API is unchanged — no consuming component needs modification.
 */
import { useSyncExternalStore } from "react";
import {
  collection,
  doc,
  onSnapshot,
  setDoc,
  deleteDoc,
  writeBatch,
  query,
  orderBy,
} from "firebase/firestore";
import { getFirebaseDb, getFirebaseAuth, isFirebaseConfigured } from "@/lib/firebase/config";
import type {
  ActivityEntry,
  Candidate,
  CandidateTag,
  JobRequirements,
  RecruiterNote,
  ScreeningRecord,
  ScreeningStatus,
} from "@/lib/types";

/** Stable shared empty state — must never be recreated (useSyncExternalStore). */
const EMPTY_STATE: WorkspaceState = Object.freeze({
  jobs: [],
  candidates: [],
  activity: [],
});

export interface WorkspaceState {
  jobs: JobRequirements[];
  candidates: Candidate[];
  activity: ActivityEntry[];
}

let state: WorkspaceState | null = null;
const listeners = new Set<() => void>();
let hydrated = false;
let unsubscribers: (() => void)[] = [];
let firestoreReady = false;
let activeWorkspaceId: string | null = null;

const WS_STORAGE_KEY = "hirelens_active_workspace";

/* ───────────────────────── Workspace switching ───────────────────────── */

export function getActiveWorkspaceId(): string | null {
  return activeWorkspaceId;
}

export function setActiveWorkspace(wsId: string) {
  activeWorkspaceId = wsId;
  try { localStorage.setItem(WS_STORAGE_KEY, wsId); } catch {}
  // Reset state and re-subscribe
  state = { jobs: [], candidates: [], activity: [] };
  offersState = [];
  onboardingState = [];
  firestoreReady = false;
  unsubscribers.forEach((unsub) => unsub());
  unsubscribers = [];
  emit();
  if (getUid()) {
    subscribeToFirestore();
  }
}

/* ───────────────────────── Firestore helpers ───────────────────────── */

function getUid(): string | null {
  if (!isFirebaseConfigured()) return null;
  try {
    const user = getFirebaseAuth().currentUser;
    return user?.uid ?? null;
  } catch {
    return null;
  }
}

function getWsId(): string {
  return activeWorkspaceId ?? getUid() ?? "";
}

function jobsCol() {
  const wsId = getWsId();
  if (!wsId) return null;
  return collection(getFirebaseDb(), `workspaces/${wsId}/jobs`);
}

function candidatesCol() {
  const wsId = getWsId();
  if (!wsId) return null;
  return collection(getFirebaseDb(), `workspaces/${wsId}/candidates`);
}

function activityCol() {
  const wsId = getWsId();
  if (!wsId) return null;
  return collection(getFirebaseDb(), `workspaces/${wsId}/activity`);
}

/* ───────────────────────── State management ───────────────────────── */

export function getState(): WorkspaceState {
  if (!hydrated) hydrate();
  return state ?? EMPTY_STATE;
}

function hydrate() {
  if (hydrated) return;
  if (typeof window === "undefined") return;

  state = { jobs: [], candidates: [], activity: [] };
  hydrated = true;

  // Restore active workspace from localStorage
  try {
    const saved = localStorage.getItem(WS_STORAGE_KEY);
    if (saved) activeWorkspaceId = saved;
  } catch {}

  if (getUid()) {
    // If no workspace set, default to personal (user UID)
    if (!activeWorkspaceId) {
      activeWorkspaceId = getUid();
    }
    subscribeToFirestore();
  }
}

function subscribeToFirestore() {
  unsubscribers.forEach((unsub) => unsub());
  unsubscribers = [];
  firestoreReady = false;

  const jobsRef = jobsCol();
  const candidatesRef = candidatesCol();
  const activityRef = activityCol();
  if (!jobsRef || !candidatesRef || !activityRef) return;

  let jobsLoaded = false;
  let candidatesLoaded = false;
  let activityLoaded = false;

  function checkReady() {
    if (jobsLoaded && candidatesLoaded && activityLoaded && !firestoreReady) {
      firestoreReady = true;
      notify();
    }
  }

  function notify() {
    for (const l of listeners) l();
  }

  const unsubJobs = onSnapshot(query(jobsRef, orderBy("createdAt", "desc")), (snap) => {
    const s = state ?? { jobs: [], candidates: [], activity: [] };
    const jobsMap = new Map<string, JobRequirements>();
    for (const j of s.jobs) jobsMap.set(j.id, j);
    for (const change of snap.docChanges()) {
      const data = change.doc.data() as Record<string, unknown>;
      if (change.type === "removed") {
        jobsMap.delete(change.doc.id);
      } else {
        const job: JobRequirements = {
          id: change.doc.id,
          title: (data.title as string) ?? "",
          company: data.company as string | undefined,
          requiredSkills: (data.required_skills as JobRequirements["requiredSkills"]) ?? [],
          preferredSkills: (data.preferred_skills as JobRequirements["preferredSkills"]) ?? [],
          minYearsExperience: data.min_years_experience as number | undefined,
          educationRequirement: data.education_requirement as JobRequirements["educationRequirement"],
          certificationRequirements: (data.certification_requirements as string[]) ?? [],
          seniorityTarget: data.seniority_target as JobRequirements["seniorityTarget"],
          keywords: (data.keywords as string[]) ?? [],
          domains: (data.domains as string[]) ?? [],
          responsibilities: (data.responsibilities as string[]) ?? [],
          sourceLength: data.source_length as number | undefined,
          createdAt: (data.createdAt as string) ?? new Date().toISOString(),
        };
        jobsMap.set(change.doc.id, job);
      }
    }
    state = { ...s, jobs: Array.from(jobsMap.values()) };
    jobsLoaded = true;
    checkReady();
  });

  const unsubCandidates = onSnapshot(query(candidatesRef, orderBy("createdAt", "desc")), (snap) => {
    const s = state ?? { jobs: [], candidates: [], activity: [] };
    const candMap = new Map<string, Candidate>();
    for (const c of s.candidates) candMap.set(c.id, c);
    for (const change of snap.docChanges()) {
      const data = change.doc.data() as Record<string, unknown>;
      if (change.type === "removed") {
        candMap.delete(change.doc.id);
      } else {
        const candidate: Candidate = {
          id: change.doc.id,
          fileName: data.file_name as string | undefined,
          resume: (data.resume as Candidate["resume"]) ?? { skills: [], experience: [], education: [], certifications: [], domains: [], rawTextLength: 0, confidence: 0, parseWarnings: [] },
          screenings: (data.screenings as ScreeningRecord[]) ?? [],
          notes: (data.notes as RecruiterNote[]) ?? [],
          interviews: (data.interviews as Candidate["interviews"]) ?? [],
          tags: (data.tags as CandidateTag[]) ?? [],
          status: (data.status as ScreeningStatus) ?? "new",
          createdAt: (data.createdAt as string) ?? new Date().toISOString(),
        };
        candMap.set(change.doc.id, candidate);
      }
    }
    state = { ...s, candidates: Array.from(candMap.values()) };
    candidatesLoaded = true;
    checkReady();
  });

  const unsubActivity = onSnapshot(query(activityRef, orderBy("createdAt", "desc")), (snap) => {
    const s = state ?? { jobs: [], candidates: [], activity: [] };
    const acts: ActivityEntry[] = [];
    for (const d of snap.docs) {
      const data = d.data() as Record<string, unknown>;
      acts.push({
        id: d.id,
        kind: (data.kind as ActivityEntry["kind"]) ?? "screen",
        message: (data.message as string) ?? "",
        at: (data.at as string) ?? (data.createdAt as string) ?? new Date().toISOString(),
      });
    }
    state = { ...s, activity: acts };
    activityLoaded = true;
    checkReady();
  });

  unsubscribers = [unsubJobs, unsubCandidates, unsubActivity];
}

function emit() {
  for (const l of listeners) l();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  if (!hydrated) hydrate();

  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) {
      unsubscribers.forEach((unsub) => unsub());
      unsubscribers = [];
      firestoreReady = false;
    }
  };
}

/** React hook — re-renders whenever any part of the workspace changes. */
export function useWorkspace(): WorkspaceState {
  return useSyncExternalStore(
    subscribe,
    getState,
    function getServerState() {
      return EMPTY_STATE;
    },
  );
}

/* ───────────────────────── Firestore writes ───────────────────────── */

async function writeJob(job: JobRequirements) {
  if (!isFirebaseConfigured()) return;
  const ref = jobsCol();
  if (!ref) return;
  try {
    await setDoc(doc(ref, job.id), {
      title: job.title,
      company: job.company ?? null,
      required_skills: job.requiredSkills,
      preferred_skills: job.preferredSkills,
      min_years_experience: job.minYearsExperience ?? null,
      education_requirement: job.educationRequirement ?? null,
      certification_requirements: job.certificationRequirements,
      seniority_target: job.seniorityTarget ?? null,
      keywords: job.keywords,
      domains: job.domains,
      responsibilities: job.responsibilities ?? [],
      source_length: job.sourceLength ?? null,
      createdAt: job.createdAt,
    });
  } catch (e) {
    console.error("Failed to write job to Firestore:", e);
  }
}

async function removeJob(jobId: string) {
  if (!isFirebaseConfigured()) return;
  const ref = jobsCol();
  if (!ref) return;
  try {
    await deleteDoc(doc(ref, jobId));
  } catch (e) {
    console.error("Failed to delete job from Firestore:", e);
  }
}

async function writeCandidate(candidate: Candidate) {
  if (!isFirebaseConfigured()) return;
  const ref = candidatesCol();
  if (!ref) return;
  try {
    await setDoc(doc(ref, candidate.id), {
      file_name: candidate.fileName ?? null,
      resume: candidate.resume,
      screenings: candidate.screenings,
      notes: candidate.notes,
      interviews: candidate.interviews,
      tags: candidate.tags,
      status: candidate.status,
      createdAt: candidate.createdAt,
    });
  } catch (e) {
    console.error("Failed to write candidate to Firestore:", e);
  }
}

async function writeActivityEntry(entry: ActivityEntry) {
  if (!isFirebaseConfigured()) return;
  const ref = activityCol();
  if (!ref) return;
  try {
    await setDoc(doc(ref, entry.id), {
      kind: entry.kind,
      message: entry.message,
      at: entry.at,
      createdAt: entry.at,
    });
  } catch (e) {
    console.error("Failed to write activity to Firestore:", e);
  }
}

/* ───────────────────────── Mutations ───────────────────────── */

export function upsertJobs(jobs: JobRequirements[]) {
  const s = getState();
  for (const job of jobs) {
    if (!s.jobs.some((j) => j.id === job.id)) s.jobs.unshift(job);
    writeJob(job);
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

  writeJob(job);
  writeActivityEntry(s.activity[0]);
}

export function deleteJob(jobId: string) {
  const s = getState();
  state = { ...s, jobs: s.jobs.filter((j) => j.id !== jobId) };
  emit();
  removeJob(jobId);
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
        const updated = {
          ...existing,
          resume: mergeResume(existing.resume, nc.resume),
          screenings: [...existing.screenings, ...freshScreens],
          createdAt: existing.createdAt,
          fileName: existing.fileName ?? nc.fileName,
        };
        s.candidates[existingIdx] = updated;
        writeCandidate(updated);
      }
    } else {
      addedCount++;
      s.candidates.push(nc);
      writeCandidate(nc);
    }
  }

  const activityEntry: ActivityEntry = {
    id: crypto.randomUUID(),
    kind: "screen",
    message: `Screened ${newCandidates.length} candidate${newCandidates.length === 1 ? "" : "s"} against "${job.title}" (${addedCount} new, ${updatedCount} updated)`,
    at: new Date().toISOString(),
  };
  s.activity.unshift(activityEntry);
  s.activity = s.activity.slice(0, 60);
  state = s;
  emit();

  writeActivityEntry(activityEntry);
}

function mergeResume(a: Candidate["resume"], b: Candidate["resume"]) {
  return b.skills.length >= a.skills.length ? b : a;
}

export function addNote(candidateId: string, text: string, type: RecruiterNote["type"] = "general") {
  const s = getState();
  const note: RecruiterNote = { id: crypto.randomUUID(), text, type, pinned: false, createdAt: new Date().toISOString() };
  const updatedCandidates = s.candidates.map((c) =>
    c.id === candidateId ? { ...c, notes: [note, ...c.notes] } : c,
  );
  state = {
    ...s,
    candidates: updatedCandidates,
    activity: [
      { id: crypto.randomUUID(), kind: "note" as const, message: `Note added to candidate`, at: note.createdAt },
      ...s.activity,
    ].slice(0, 60),
  };
  emit();

  const candidate = updatedCandidates.find((c) => c.id === candidateId);
  if (candidate) writeCandidate(candidate);
  writeActivityEntry(state.activity[0]);
}

export function deleteNote(candidateId: string, noteId: string) {
  const s = getState();
  const updatedCandidates = s.candidates.map((c) =>
    c.id === candidateId ? { ...c, notes: c.notes.filter((n) => n.id !== noteId) } : c,
  );
  state = { ...s, candidates: updatedCandidates };
  emit();

  const candidate = updatedCandidates.find((c) => c.id === candidateId);
  if (candidate) writeCandidate(candidate);
}

export function editNote(candidateId: string, noteId: string, text: string) {
  const s = getState();
  const updatedCandidates = s.candidates.map((c) =>
    c.id === candidateId
      ? { ...c, notes: c.notes.map((n) => (n.id === noteId ? { ...n, text, updatedAt: new Date().toISOString() } : n)) }
      : c,
  );
  state = { ...s, candidates: updatedCandidates };
  emit();
  const candidate = updatedCandidates.find((c) => c.id === candidateId);
  if (candidate) writeCandidate(candidate);
}

export function toggleNotePin(candidateId: string, noteId: string) {
  const s = getState();
  const updatedCandidates = s.candidates.map((c) =>
    c.id === candidateId
      ? { ...c, notes: c.notes.map((n) => (n.id === noteId ? { ...n, pinned: !n.pinned } : n)) }
      : c,
  );
  state = { ...s, candidates: updatedCandidates };
  emit();
  const candidate = updatedCandidates.find((c) => c.id === candidateId);
  if (candidate) writeCandidate(candidate);
}

export function addTag(candidateId: string, tag: CandidateTag) {
  const s = getState();
  const updatedCandidates = s.candidates.map((c) =>
    c.id === candidateId ? { ...c, tags: [...c.tags.filter((t) => t.id !== tag.id), tag] } : c,
  );
  state = { ...s, candidates: updatedCandidates };
  emit();
  const candidate = updatedCandidates.find((c) => c.id === candidateId);
  if (candidate) writeCandidate(candidate);
}

export function removeTag(candidateId: string, tagId: string) {
  const s = getState();
  const updatedCandidates = s.candidates.map((c) =>
    c.id === candidateId ? { ...c, tags: c.tags.filter((t) => t.id !== tagId) } : c,
  );
  state = { ...s, candidates: updatedCandidates };
  emit();
  const candidate = updatedCandidates.find((c) => c.id === candidateId);
  if (candidate) writeCandidate(candidate);
}

export function bulkUpdateStatus(candidateIds: string[], status: ScreeningStatus) {
  const s = getState();
  const updatedCandidates = s.candidates.map((c) =>
    candidateIds.includes(c.id) ? { ...c, status } : c,
  );
  state = { ...s, candidates: updatedCandidates };
  emit();
  for (const id of candidateIds) {
    const c = updatedCandidates.find((x) => x.id === id);
    if (c) writeCandidate(c);
  }
}

export function bulkAddTag(candidateIds: string[], tag: CandidateTag) {
  const s = getState();
  const updatedCandidates = s.candidates.map((c) =>
    candidateIds.includes(c.id) ? { ...c, tags: [...c.tags.filter((t) => t.id !== tag.id), tag] } : c,
  );
  state = { ...s, candidates: updatedCandidates };
  emit();
  for (const id of candidateIds) {
    const c = updatedCandidates.find((x) => x.id === id);
    if (c) writeCandidate(c);
  }
}

export function bulkDelete(candidateIds: string[]) {
  const s = getState();
  const updatedCandidates = s.candidates.filter((c) => !candidateIds.includes(c.id));
  state = { ...s, candidates: updatedCandidates };
  emit();
  for (const id of candidateIds) {
    removeCandidate(id);
  }
}

function removeCandidate(candidateId: string) {
  if (!isFirebaseConfigured()) return;
  const ref = candidatesCol();
  if (!ref) return;
  try {
    deleteDoc(doc(ref, candidateId));
  } catch (e) {
    console.error("Failed to delete candidate from Firestore:", e);
  }
}

const STATUSES: ScreeningStatus[] = ["new", "screening", "shortlisted", "interview", "rejected", "hired"];
export const ALL_STATUSES = STATUSES;

export function setStatus(candidateId: string, status: ScreeningStatus) {
  const s = getState();
  const activityEntry: ActivityEntry = {
    id: crypto.randomUUID(),
    kind: "status-change" as const,
    message: `Candidate moved to ${status}`,
    at: new Date().toISOString(),
  };
  const updatedCandidates = s.candidates.map((c) => (c.id === candidateId ? { ...c, status } : c));
  state = {
    ...s,
    candidates: updatedCandidates,
    activity: [activityEntry, ...s.activity.slice(0, 59)],
  };
  emit();

  const candidate = updatedCandidates.find((c) => c.id === candidateId);
  if (candidate) writeCandidate(candidate);
  writeActivityEntry(activityEntry);
}

export function getCandidate(id: string): Candidate | undefined {
  return getState().candidates.find((c) => c.id === id);
}

export function getJob(id: string): JobRequirements | undefined {
  return getState().jobs.find((j) => j.id === id);
}

export function updateCandidate(updated: Candidate) {
  const s = getState();
  state = {
    ...s,
    candidates: s.candidates.map((c) => (c.id === updated.id ? updated : c)),
  };
  emit();
  writeCandidate(updated);
}

export async function resetWorkspace(demoData?: WorkspaceState) {
  state = demoData ?? { jobs: [], candidates: [], activity: [] };
  emit();

  if (!isFirebaseConfigured()) return;

  const ref = jobsCol();
  const cref = candidatesCol();
  const aref = activityCol();
  if (!ref || !cref || !aref) return;

  try {
    const { getDocs } = await import("firebase/firestore");
    const [existingJobs, existingCands, existingActs] = await Promise.all([
      getDocs(query(ref)),
      getDocs(query(cref)),
      getDocs(query(aref)),
    ]);

    const batch = writeBatch(getFirebaseDb());
    existingJobs.forEach((d) => batch.delete(d.ref));
    existingCands.forEach((d) => batch.delete(d.ref));
    existingActs.forEach((d) => batch.delete(d.ref));
    await batch.commit();

    if (demoData) {
      for (const job of demoData.jobs) await writeJob(job);
      for (const cand of demoData.candidates) await writeCandidate(cand);
      for (const act of demoData.activity) await writeActivityEntry(act);
    }
  } catch (e) {
    console.error("Failed to reset workspace in Firestore:", e);
  }
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
      interviews: [],
      tags: [],
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

/* ───────────────────────── Offer tracking ───────────────────────── */

import type { Offer, OfferStatus, OnboardingTask, OnboardingTaskStatus } from "@/lib/types";

let offersState: Offer[] = [];
let onboardingState: OnboardingTask[] = [];

function offersCol() {
  const wsId = getWsId();
  if (!wsId) return null;
  return collection(getFirebaseDb(), `workspaces/${wsId}/offers`);
}

function onboardingCol() {
  const wsId = getWsId();
  if (!wsId) return null;
  return collection(getFirebaseDb(), `workspaces/${wsId}/onboarding`);
}

export function getOffers(): Offer[] {
  return offersState;
}

export function getOnboardingTasks(): OnboardingTask[] {
  return onboardingState;
}

export async function createOffer(offer: Omit<Offer, "id" | "createdAt" | "updatedAt">): Promise<Offer | null> {
  if (!isFirebaseConfigured()) return null;
  const ref = offersCol();
  if (!ref) return null;

  const newOffer: Offer = {
    ...offer,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  try {
    await setDoc(doc(ref, newOffer.id), newOffer);
    offersState = [newOffer, ...offersState];
    emit();
    return newOffer;
  } catch (e) {
    console.error("Failed to create offer:", e);
    return null;
  }
}

export async function updateOffer(offer: Offer): Promise<void> {
  if (!isFirebaseConfigured()) return;
  const ref = offersCol();
  if (!ref) return;

  const updated = { ...offer, updatedAt: new Date().toISOString() };
  try {
    await setDoc(doc(ref, offer.id), updated);
    offersState = offersState.map((o) => (o.id === offer.id ? updated : o));
    emit();
  } catch (e) {
    console.error("Failed to update offer:", e);
  }
}

export async function updateOfferStatus(offerId: string, status: OfferStatus): Promise<void> {
  const offer = offersState.find((o) => o.id === offerId);
  if (!offer) return;
  await updateOffer({ ...offer, status });
}

export async function deleteOffer(offerId: string): Promise<void> {
  if (!isFirebaseConfigured()) return;
  const ref = offersCol();
  if (!ref) return;

  try {
    await deleteDoc(doc(ref, offerId));
    offersState = offersState.filter((o) => o.id !== offerId);
    emit();
  } catch (e) {
    console.error("Failed to delete offer:", e);
  }
}

export function getOfferForCandidate(candidateId: string): Offer | undefined {
  return offersState.find((o) => o.candidateId === candidateId);
}

/* ───────────────────────── Onboarding tasks ───────────────────────── */

export async function createOnboardingTask(task: Omit<OnboardingTask, "id" | "createdAt">): Promise<OnboardingTask | null> {
  if (!isFirebaseConfigured()) return null;
  const ref = onboardingCol();
  if (!ref) return null;

  const newTask: OnboardingTask = {
    ...task,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  };

  try {
    await setDoc(doc(ref, newTask.id), newTask);
    onboardingState = [newTask, ...onboardingState];
    emit();
    return newTask;
  } catch (e) {
    console.error("Failed to create onboarding task:", e);
    return null;
  }
}

export async function updateOnboardingTask(task: OnboardingTask): Promise<void> {
  if (!isFirebaseConfigured()) return;
  const ref = onboardingCol();
  if (!ref) return;

  try {
    await setDoc(doc(ref, task.id), task);
    onboardingState = onboardingState.map((t) => (t.id === task.id ? task : t));
    emit();
  } catch (e) {
    console.error("Failed to update onboarding task:", e);
  }
}

export async function completeOnboardingTask(taskId: string): Promise<void> {
  const task = onboardingState.find((t) => t.id === taskId);
  if (!task) return;
  await updateOnboardingTask({ ...task, status: "completed", completedAt: new Date().toISOString() });
}

export async function deleteOnboardingTask(taskId: string): Promise<void> {
  if (!isFirebaseConfigured()) return;
  const ref = onboardingCol();
  if (!ref) return;

  try {
    await deleteDoc(doc(ref, taskId));
    onboardingState = onboardingState.filter((t) => t.id !== taskId);
    emit();
  } catch (e) {
    console.error("Failed to delete onboarding task:", e);
  }
}

export function getOnboardingTasksForCandidate(candidateId: string): OnboardingTask[] {
  return onboardingState.filter((t) => t.candidateId === candidateId);
}
