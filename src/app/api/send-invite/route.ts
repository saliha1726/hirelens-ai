import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

function getResend() {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  return new Resend(key);
}

export async function POST(request: NextRequest) {
  try {
    const { email, workspaceName, inviterName, role } = await request.json();

    if (!email || !workspaceName || !inviterName) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const resend = getResend();
    if (!resend) {
      return NextResponse.json({ error: "Email not configured" }, { status: 503 });
    }

    const { data, error } = await resend.emails.send({
      from: "HireLens AI <onboarding@resend.dev>",
      to: email,
      subject: `${inviterName} invited you to "${workspaceName}" on HireLens AI`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin:0;padding:0;background-color:#fff1f2;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
          <div style="max-width:560px;margin:40px auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06);">
            <div style="background:linear-gradient(135deg,#f43f5e,#ec4899);padding:32px;text-align:center;">
              <div style="display:inline-flex;align-items:center;justify-content:center;width:48px;height:48px;background:rgba(255,255,255,0.2);border-radius:12px;margin-bottom:12px;">
                <span style="font-size:24px;">👁</span>
              </div>
              <h1 style="color:#fff;margin:0;font-size:22px;font-weight:700;">HireLens AI</h1>
            </div>
            <div style="padding:32px;">
              <h2 style="color:#0f172a;font-size:20px;margin:0 0 12px;">You've been invited!</h2>
              <p style="color:#475569;font-size:15px;line-height:1.6;margin:0 0 20px;">
                <strong>${inviterName}</strong> invited you to join <strong>"${workspaceName}"</strong> as a <strong>${role}</strong>.
              </p>
              <p style="color:#475569;font-size:15px;line-height:1.6;margin:0 0 24px;">
                Sign in to HireLens AI and accept the invite from your Team Settings page.
              </p>
              <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://hirelens-ai-black.vercel.app"}/team" style="display:inline-block;background:linear-gradient(135deg,#f43f5e,#ec4899);color:#fff;text-decoration:none;padding:12px 28px;border-radius:10px;font-weight:600;font-size:15px;">View Team Settings</a>
              <hr style="border:none;border-top:1px solid #e2e8f0;margin:28px 0;">
              <p style="color:#94a3b8;font-size:13px;line-height:1.5;margin:0;">
                If you don't have a HireLens AI account yet, you can sign up for free at
                <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://hirelens-ai-black.vercel.app"}/signup" style="color:#f43f5e;">hirelens-ai-black.vercel.app</a>.
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    if (error) {
      console.error("Resend error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, id: data?.id });
  } catch (e) {
    console.error("Invite email error:", e);
    return NextResponse.json({ error: "Failed to send invite" }, { status: 500 });
  }
}
