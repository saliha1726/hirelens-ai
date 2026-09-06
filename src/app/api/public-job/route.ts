import { NextRequest, NextResponse } from "next/server";
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

function getAdminDb() {
  if (getApps().length === 0) {
    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      }),
    });
  }
  return getFirestore();
}

export async function GET(req: NextRequest) {
  const wsId = req.nextUrl.searchParams.get("wsId");
  const jobId = req.nextUrl.searchParams.get("jobId");

  if (!wsId || !jobId) {
    return NextResponse.json({ error: "Missing wsId or jobId" }, { status: 400 });
  }

  try {
    const db = getAdminDb();
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
