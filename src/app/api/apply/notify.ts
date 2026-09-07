import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { getAdminFirestore } from "@/lib/firebase/server";

export const runtime = "nodejs";

/**
 * Internal helper: notify workspace owner/admins that a candidate applied online.
 * Called from /api/apply after a successful application.
 * Silently no-ops when Gmail env vars are missing — never blocks an application.
 */
export async function notifyNewApplication(params: {
  wsId: string;
  jobTitle: string;
  applicantName: string;
  applicantEmail: string;
  matchScore: number;
  matchedSkills: number;
}): Promise<void> {
  const gmailUser = process.env.GMAIL_USER;
  const gmailPass = process.env.GMAIL_APP_PASSWORD;
  if (!gmailUser || !gmailPass) return;

  try {
    const db = await getAdminFirestore();

    // Fetch the workspace owner + admin members to notify
    const wsSnap = await db.doc(`workspaces/${params.wsId}`).get();
    const ownerUid = wsSnap.exists ? (wsSnap.data()!.ownerId as string | undefined) : undefined;

    const recipients: string[] = [];
    if (ownerUid) {
      const ownerSnap = await db.doc(`workspaces/${params.wsId}/members/${ownerUid}`).get();
      if (ownerSnap.exists) {
        const email = ownerSnap.data()!.email as string | undefined;
        if (email) recipients.push(email);
      }
    }
    // Also notify admins
    const membersSnap = await db.collection(`workspaces/${params.wsId}/members`).where("role", "==", "admin").get();
    for (const m of membersSnap.docs) {
      const email = m.data().email as string | undefined;
      if (email && !recipients.includes(email)) recipients.push(email);
    }
    if (recipients.length === 0) return;

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: gmailUser, pass: gmailPass },
    });

    const score = Math.round(params.matchScore);
    const scoreColor = score >= 80 ? "#059669" : score >= 65 ? "#d97706" : "#475569";

    await transporter.sendMail({
      from: `"HireLens AI" <${gmailUser}>`,
      to: recipients.join(", "),
      subject: `New application: ${params.applicantName} applied for ${params.jobTitle} (${score}% match)`,
      html: `
        <!DOCTYPE html>
        <html>
        <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
        <body style="margin:0;padding:0;background-color:#fff1f2;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
          <div style="max-width:560px;margin:40px auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06);">
            <div style="background:linear-gradient(135deg,#f43f5e,#ec4899);padding:28px;text-align:center;">
              <h1 style="color:#fff;margin:0;font-size:20px;font-weight:700;">New Application</h1>
            </div>
            <div style="padding:32px;">
              <p style="color:#475569;font-size:15px;line-height:1.6;margin:0 0 16px;">
                <strong style="color:#0f172a;font-size:17px;">${params.applicantName}</strong> applied via your public link for
                <strong>${params.jobTitle}</strong>.
              </p>
              <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:16px;margin:0 0 24px;">
                <p style="margin:0 0 8px;color:#64748b;font-size:13px;">Match score</p>
                <p style="margin:0;font-size:28px;font-weight:700;color:${scoreColor};">${score}%</p>
                <p style="margin:4px 0 0;color:#64748b;font-size:13px;">${params.matchedSkills} required skills matched</p>
              </div>
              <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://hirelens-ai-black.vercel.app"}/candidates" style="display:inline-block;background:linear-gradient(135deg,#f43f5e,#ec4899);color:#fff;text-decoration:none;padding:12px 28px;border-radius:10px;font-weight:600;font-size:15px;">Review candidate</a>
              <hr style="border:none;border-top:1px solid #e2e8f0;margin:28px 0;">
              <p style="color:#94a3b8;font-size:13px;margin:0;">Applicant email: <a href="mailto:${params.applicantEmail}" style="color:#f43f5e;">${params.applicantEmail}</a></p>
            </div>
          </div>
        </body>
        </html>
      `,
    });
  } catch (e) {
    // Notification is best-effort — never surface email failures to applicants
    console.error("Application notification failed:", e);
  }
}
