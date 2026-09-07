import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { getAdminFirestore } from "@/lib/firebase/server";
import { extractText, sanitizeFileName } from "@/lib/parsing/documents";
import { parseResume } from "@/lib/parsing/resume-parser";
import { computeMatch } from "@/lib/scoring/engine";
import type { JobRequirements } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const wsId = String(form.get("wsId") ?? "").trim();
    const jobId = String(form.get("jobId") ?? "").trim();
    const fullName = String(form.get("fullName") ?? "").trim();
    const email = String(form.get("email") ?? "").trim();
    const phone = String(form.get("phone") ?? "").trim();
    const coverLetter = String(form.get("coverLetter") ?? "").trim();
    const file = form.get("resume") as File | null;

    if (!wsId || !jobId || !fullName || !email || !file) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "Resume must be under 10 MB" }, { status: 400 });
    }

    const db = await getAdminFirestore();

    // Fetch the job
    const jobSnap = await db.doc(`workspaces/${wsId}/jobs/${jobId}`).get();
    if (!jobSnap.exists) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }
    const d = jobSnap.data()!;
    const job: JobRequirements = {
      id: jobId,
      title: d.title as string,
      company: d.company as string | undefined,
      requiredSkills: (d.required_skills ?? []) as JobRequirements["requiredSkills"],
      preferredSkills: (d.preferred_skills ?? []) as JobRequirements["preferredSkills"],
      minYearsExperience: d.min_years_experience as number | undefined,
      educationRequirement: d.education_requirement as JobRequirements["educationRequirement"],
      certificationRequirements: (d.certification_requirements ?? []) as string[],
      seniorityTarget: d.seniority_target as JobRequirements["seniorityTarget"],
      keywords: (d.keywords ?? []) as string[],
      domains: (d.domains ?? []) as string[],
      responsibilities: (d.responsibilities ?? []) as string[],
      sourceLength: d.source_length as number | undefined,
      createdAt: d.createdAt as string,
    };

    // Parse resume
    const bytes = new Uint8Array(await file.arrayBuffer());
    const text = await extractText(sanitizeFileName(file.name), bytes);
    if (text.trim().length < 20) {
      return NextResponse.json({ error: "Could not extract enough text from resume" }, { status: 422 });
    }
    const resume = parseResume(text);

    // Compute match score
    const match = computeMatch(resume, job, text);

    const now = new Date().toISOString();
    const candidateId = randomUUID();

    // Build candidate document
    const candidateDoc = {
      file_name: file.name,
      resume,
      screenings: [{
        id: randomUUID(),
        jobId,
        jobTitle: job.title,
        match,
        createdAt: now,
      }],
      notes: [{
        id: randomUUID(),
        text: `Applied via public link${coverLetter ? "\n\nCover letter:\n" + coverLetter : ""}`,
        type: "general",
        pinned: false,
        createdAt: now,
      }],
      interviews: [],
      tags: [{ id: randomUUID(), name: "Applied Online", color: "#8b5cf6" }],
      status: "new",
      createdAt: now,
      applicantName: fullName,
      applicantEmail: email,
      applicantPhone: phone || null,
    };

    // Write to Firestore
    await db.doc(`workspaces/${wsId}/candidates/${candidateId}`).set(candidateDoc);

    // Write activity entry
    await db.collection(`workspaces/${wsId}/activity`).add({
      kind: "screen",
      message: `${fullName} applied for ${job.title} via public link`,
      at: now,
      createdAt: now,
    });

    return NextResponse.json({
      success: true,
      candidateId,
      match: { score: match.overallScore, matched: match.matchedSkills.length },
    });
  } catch (e) {
    console.error("Application error:", e);
    return NextResponse.json({ error: "Failed to submit application" }, { status: 500 });
  }
}
