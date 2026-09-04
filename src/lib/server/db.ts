/**
 * Server-side data access layer for HireLens AI.
 *
 * All database operations go through this layer.
 * Workspace ownership is enforced by Supabase RLS policies.
 */
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { JobRequirements, ScreeningStatus } from "@/lib/types";

/* ───────────────────────── Workspace ───────────────────────── */

export async function getWorkspace(userId: string) {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from("workspaces")
    .select("id, name")
    .eq("owner_id", userId)
    .single();

  if (error) throw new Error("Could not load workspace");
  return data;
}

/* ───────────────────────── Jobs ───────────────────────── */

export async function getJobs(workspaceId: string) {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from("jobs")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false });

  if (error) throw new Error("Could not load jobs");
  return data;
}

export async function getJob(jobId: string, workspaceId: string) {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from("jobs")
    .select("*")
    .eq("id", jobId)
    .eq("workspace_id", workspaceId)
    .single();

  if (error) return null;
  return data;
}

export async function createJob(job: Omit<JobRequirements, "id" | "createdAt"> & { id?: string }, workspaceId: string) {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from("jobs")
    .insert({
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
    })
    .select()
    .single();

  if (error) throw new Error("Could not create job");
  return data;
}

export async function updateJob(jobId: string, updates: Partial<JobRequirements>, workspaceId: string) {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from("jobs")
    .update({
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
    })
    .eq("id", jobId)
    .eq("workspace_id", workspaceId)
    .select()
    .single();

  if (error) throw new Error("Could not update job");
  return data;
}

export async function deleteJob(jobId: string, workspaceId: string) {
  const supabase = await getSupabaseServerClient();
  const { error } = await supabase
    .from("jobs")
    .delete()
    .eq("id", jobId)
    .eq("workspace_id", workspaceId);

  if (error) throw new Error("Could not delete job");
}

/* ───────────────────────── Candidates ───────────────────────── */

export async function getCandidates(workspaceId: string) {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from("candidates")
    .select("*, screening_results(*)")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false });

  if (error) throw new Error("Could not load candidates");
  return data;
}

export async function getCandidate(candidateId: string, workspaceId: string) {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from("candidates")
    .select("*, screening_results(*), candidate_notes(*)")
    .eq("id", candidateId)
    .eq("workspace_id", workspaceId)
    .single();

  if (error) return null;
  return data;
}

export async function updateCandidateStatus(candidateId: string, status: ScreeningStatus, workspaceId: string) {
  const supabase = await getSupabaseServerClient();
  const { error } = await supabase
    .from("candidates")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", candidateId)
    .eq("workspace_id", workspaceId);

  if (error) throw new Error("Could not update candidate status");
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
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from("screening_results")
    .insert({
      candidate_id: result.candidateId,
      job_id: result.jobId,
      workspace_id: result.workspaceId,
      match_data: result.matchData,
      ai_insight: result.aiInsight ?? null,
      ai_error: result.aiError ?? null,
    })
    .select()
    .single();

  if (error) throw new Error("Could not save screening result");
  return data;
}

/* ───────────────────────── Notes ───────────────────────── */

export async function addNote(candidateId: string, text: string, workspaceId: string) {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from("candidate_notes")
    .insert({
      candidate_id: candidateId,
      workspace_id: workspaceId,
      text,
    })
    .select()
    .single();

  if (error) throw new Error("Could not add note");
  return data;
}

export async function deleteNote(noteId: string, workspaceId: string) {
  const supabase = await getSupabaseServerClient();
  const { error } = await supabase
    .from("candidate_notes")
    .delete()
    .eq("id", noteId)
    .eq("workspace_id", workspaceId);

  if (error) throw new Error("Could not delete note");
}

/* ───────────────────────── Activity ───────────────────────── */

export async function addActivity(kind: string, message: string, workspaceId: string) {
  const supabase = await getSupabaseServerClient();
  const { error } = await supabase
    .from("candidate_activity")
    .insert({
      workspace_id: workspaceId,
      kind,
      message,
    });

  if (error) throw new Error("Could not log activity");
}

export async function getActivity(workspaceId: string, limit = 20) {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from("candidate_activity")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error("Could not load activity");
  return data;
}
