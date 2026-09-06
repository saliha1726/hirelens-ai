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
  if (!wsId) {
    return NextResponse.json({ error: "Missing wsId" }, { status: 400 });
  }

  try {
    const db = getAdminDb();
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
