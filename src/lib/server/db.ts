/**
 * Server-side data access layer for HireLens AI.
 *
 * All database operations go through this layer using Firebase Admin Firestore.
 * Workspace ownership is enforced by Firestore security rules.
 */
import type { JobRequirements, ScreeningStatus } from "@/lib/types";

async function getDb() {
  const { getAdminFirestore } = await import("@/lib/firebase/server");
  return getAdminFirestore();
}

/* ───────────────────────── Workspace ───────────────────────── */

export async function getWorkspace(userId: string) {
  const db = await getDb();
  const snap = await db.collection("workspaces").where("owner_id", "==", userId).limit(1).get();
  if (snap.empty) return null;
  const doc = snap.docs[0];
  return { id: doc.id, ...doc.data() };
}

/* ───────────────────────── Jobs ───────────────────────── */

export async function getJobs(workspaceId: string) {
  const db = await getDb();
  const snap = await db.collection("jobs")
    .where("workspace_id", "==", workspaceId)
    .orderBy("created_at", "desc")
    .get();
  return snap.docs.map((doc: FirebaseFirestore.QueryDocumentSnapshot) => ({ id: doc.id, ...doc.data() }));
}

export async function getJob(jobId: string, _workspaceId: string) {
  const db = await getDb();
  const doc = await db.collection("jobs").doc(jobId).get();
  if (!doc.exists) return null;
  return { id: doc.id, ...doc.data() };
}

export async function createJob(job: Omit<JobRequirements, "id" | "createdAt"> & { id?: string }, workspaceId: string) {
  const db = await getDb();
  const ref = await db.collection("jobs").add({
    workspace_id: workspaceId,
    title: job.title,
    company: job.company,
    required_skills: job.requiredSkills,
    preferred_skills: job.preferredSkills,
    min_years_experience: job.minYearsExperience,
    education_requirement: job.educationRequirement,
    certification_requirements: job.certificationRequirements,
    seniority_target: job.seniorityTarget,
    keywords: job.keywords,
    domains: job.domains,
    responsibilities: job.responsibilities,
    source_length: job.sourceLength,
    status: "active",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });
  const doc = await ref.get();
  return { id: doc.id, ...doc.data() };
}

export async function updateJob(jobId: string, updates: Partial<JobRequirements>, _workspaceId: string) {
  const db = await getDb();
  await db.collection("jobs").doc(jobId).update({
    title: updates.title,
    company: updates.company,
    required_skills: updates.requiredSkills,
    preferred_skills: updates.preferredSkills,
    min_years_experience: updates.minYearsExperience,
    education_requirement: updates.educationRequirement,
    certification_requirements: updates.certificationRequirements,
    seniority_target: updates.seniorityTarget,
    keywords: updates.keywords,
    domains: updates.domains,
    responsibilities: updates.responsibilities,
    updated_at: new Date().toISOString(),
  });
  const doc = await db.collection("jobs").doc(jobId).get();
  return { id: doc.id, ...doc.data() };
}

export async function deleteJob(jobId: string, _workspaceId: string) {
  const db = await getDb();
  await db.collection("jobs").doc(jobId).delete();
}

/* ───────────────────────── Candidates ───────────────────────── */

export async function getCandidates(workspaceId: string) {
  const db = await getDb();
  const snap = await db.collection("candidates")
    .where("workspace_id", "==", workspaceId)
    .orderBy("created_at", "desc")
    .get();
  return snap.docs.map((doc: FirebaseFirestore.QueryDocumentSnapshot) => ({ id: doc.id, ...doc.data() }));
}

export async function getCandidate(candidateId: string, _workspaceId: string) {
  const db = await getDb();
  const doc = await db.collection("candidates").doc(candidateId).get();
  if (!doc.exists) return null;
  return { id: doc.id, ...doc.data() };
}

export async function updateCandidateStatus(candidateId: string, status: ScreeningStatus, _workspaceId: string) {
  const db = await getDb();
  await db.collection("candidates").doc(candidateId).update({
    status,
    updated_at: new Date().toISOString(),
  });
}

/* ───────────────────────── Screening Results ───────────────────────── */

export async function createScreeningResult(result: {
  candidateId: string;
  jobId: string;
  workspaceId: string;
  matchData: object;
  aiInsight?: object;
  aiError?: string;
}) {
  const db = await getDb();
  const ref = await db.collection("screening_results").add({
    candidate_id: result.candidateId,
    job_id: result.jobId,
    workspace_id: result.workspaceId,
    match_data: result.matchData,
    ai_insight: result.aiInsight ?? null,
    ai_error: result.aiError ?? null,
    created_at: new Date().toISOString(),
  });
  const doc = await ref.get();
  return { id: doc.id, ...doc.data() };
}

/* ───────────────────────── Notes ───────────────────────── */

export async function addNote(candidateId: string, text: string, workspaceId: string) {
  const db = await getDb();
  const ref = await db.collection("candidate_notes").add({
    candidate_id: candidateId,
    workspace_id: workspaceId,
    text,
    created_at: new Date().toISOString(),
  });
  const doc = await ref.get();
  return { id: doc.id, ...doc.data() };
}

export async function deleteNote(noteId: string, _workspaceId: string) {
  const db = await getDb();
  await db.collection("candidate_notes").doc(noteId).delete();
}

/* ───────────────────────── Activity ───────────────────────── */

export async function addActivity(kind: string, message: string, workspaceId: string) {
  const db = await getDb();
  await db.collection("candidate_activity").add({
    workspace_id: workspaceId,
    kind,
    message,
    created_at: new Date().toISOString(),
  });
}

export async function getActivity(workspaceId: string, limit = 20) {
  const db = await getDb();
  const snap = await db.collection("candidate_activity")
    .where("workspace_id", "==", workspaceId)
    .orderBy("created_at", "desc")
    .limit(limit)
    .get();
  return snap.docs.map((doc: FirebaseFirestore.QueryDocumentSnapshot) => ({ id: doc.id, ...doc.data() }));
}
