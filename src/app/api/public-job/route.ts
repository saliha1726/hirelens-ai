import { NextRequest, NextResponse } from "next/server";
import { getAdminFirestore } from "@/lib/firebase/server";

export async function GET(req: NextRequest) {
  const wsId = req.nextUrl.searchParams.get("wsId");
  const jobId = req.nextUrl.searchParams.get("jobId");

  if (!wsId || !jobId) {
    return NextResponse.json({ error: "Missing wsId or jobId" }, { status: 400 });
  }

  try {
    const db = await getAdminFirestore();
    const snap = await db.doc(`workspaces/${wsId}/jobs/${jobId}`).get();
    if (!snap.exists) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }
    const data = snap.data()!;
    return NextResponse.json({
      job: {
        id: snap.id,
        title: data.title,
        company: data.company ?? null,
        requiredSkills: data.required_skills ?? [],
        preferredSkills: data.preferred_skills ?? [],
        minYearsExperience: data.min_years_experience ?? null,
        educationRequirement: data.education_requirement ?? null,
        certificationRequirements: data.certification_requirements ?? [],
        seniorityTarget: data.seniority_target ?? null,
        keywords: data.keywords ?? [],
        domains: data.domains ?? [],
        responsibilities: data.responsibilities ?? [],
        sourceLength: data.source_length ?? null,
        createdAt: data.createdAt,
      },
    });
  } catch {
    return NextResponse.json({ error: "Failed to load job" }, { status: 500 });
  }
}
