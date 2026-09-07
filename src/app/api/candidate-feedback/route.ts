import { NextRequest, NextResponse } from "next/server";
import { getAdminFirestore } from "@/lib/firebase/server";

export const runtime = "nodejs";

/**
 * Public endpoint backing the candidate feedback portal.
 * Reads one candidate from a workspace using a share token stored on the
 * candidate document (feedbackToken). The token is unguessable (UUID) and
 * only exposes a safe projection of the data — no contact info, no notes,
 * no internal statuses like "rejected".
 */
export async function GET(req: NextRequest) {
  const wsId = req.nextUrl.searchParams.get("wsId");
  const candidateId = req.nextUrl.searchParams.get("candidateId");
  const token = req.nextUrl.searchParams.get("token");

  if (!wsId || !candidateId || !token) {
    return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
  }

  try {
    const db = await getAdminFirestore();
    const snap = await db.doc(`workspaces/${wsId}/candidates/${candidateId}`).get();
    if (!snap.exists) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const d = snap.data()!;

    // Token must match
    if (d.feedbackToken !== token) {
      return NextResponse.json({ error: "Invalid or expired link" }, { status: 403 });
    }

    const screenings = (d.screenings ?? []) as Array<{
      jobTitle: string;
      match: { overallScore: number; matchedSkills: string[]; missingSkills: string[] };
    }>;
    const best = screenings.reduce<
      { jobTitle: string; match: { overallScore: number; matchedSkills: string[]; missingSkills: string[] } } | null
    >((acc, s) => (!acc || s.match.overallScore > acc.match.overallScore ? s : acc), null);

    // Public-safe projection
    return NextResponse.json({
      feedback: {
        candidateName: d.applicantName ?? d.resume?.name ?? null,
        jobTitle: best?.jobTitle ?? null,
        score: best ? Math.round(best.match.overallScore) : null,
        matchedSkills: best?.match.matchedSkills ?? [],
        missingSkills: best?.match.missingSkills ?? [],
        suggestedSkills: (best?.match.missingSkills ?? []).slice(0, 5),
        screeningsCount: screenings.length,
      },
    });
  } catch {
    return NextResponse.json({ error: "Failed to load feedback" }, { status: 500 });
  }
}
