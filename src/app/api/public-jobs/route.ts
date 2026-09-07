import { NextRequest, NextResponse } from "next/server";
import { getAdminFirestore } from "@/lib/firebase/server";

export async function GET(req: NextRequest) {
  const wsId = req.nextUrl.searchParams.get("wsId");
  if (!wsId) {
    return NextResponse.json({ error: "Missing wsId" }, { status: 400 });
  }

  try {
    const db = await getAdminFirestore();
    const snap = await db.collection(`workspaces/${wsId}/jobs`).orderBy("createdAt", "desc").get();
    const jobs = snap.docs.map((doc) => {
      const d = doc.data();
      return {
        id: doc.id,
        title: d.title,
        company: d.company ?? null,
        requiredSkills: d.required_skills ?? [],
        preferredSkills: d.preferred_skills ?? [],
        minYearsExperience: d.min_years_experience ?? null,
        educationRequirement: d.education_requirement ?? null,
        certificationRequirements: d.certification_requirements ?? [],
        seniorityTarget: d.seniority_target ?? null,
        keywords: d.keywords ?? [],
        domains: d.domains ?? [],
        responsibilities: d.responsibilities ?? [],
        sourceLength: d.source_length ?? null,
        createdAt: d.createdAt,
      };
    });
    return NextResponse.json({ jobs });
  } catch {
    return NextResponse.json({ error: "Failed to load jobs" }, { status: 500 });
  }
}
