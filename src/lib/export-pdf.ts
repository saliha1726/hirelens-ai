import type { Candidate, JobRequirements } from "@/lib/types";

/**
 * Generate a printable HTML report for a candidate and open it in a new tab
 * for the user to print/save as PDF.
 */
export function exportCandidatePDF(
  candidate: Candidate,
  jobs: JobRequirements[],
) {
  const name = candidate.resume.name ?? candidate.fileName ?? "Candidate";
  const bestScreening = candidate.screenings.reduce(
    (acc, s) => (!acc || s.match.overallScore > acc.match.overallScore ? s : acc),
    null as (typeof candidate.screenings)[number] | null,
  );
  const bestJob = bestScreening
    ? jobs.find((j) => j.id === bestScreening.jobId)
    : null;

  const matchedSkills = bestScreening?.match.matchedSkills ?? [];
  const missingSkills = bestScreening?.match.missingSkills ?? [];
  const education = candidate.resume.education ?? [];
  const experience = candidate.resume.experience ?? [];
  const certifications = candidate.resume.certifications ?? [];

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${name} — HireLens AI Report</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; color: #1e293b; padding: 40px; line-height: 1.6; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px; padding-bottom: 16px; border-bottom: 2px solid #e2e8f0; }
    .header h1 { font-size: 28px; font-weight: 700; color: #0f172a; }
    .header .meta { font-size: 13px; color: #64748b; text-align: right; }
    .badge { display: inline-block; padding: 2px 10px; border-radius: 9999px; font-size: 12px; font-weight: 600; }
    .badge-high { background: #dcfce7; color: #166534; }
    .badge-good { background: #dbeafe; color: #1e40af; }
    .badge-fair { background: #fef9c3; color: #854d0e; }
    .badge-low { background: #fee2e2; color: #991b1b; }
    .section { margin-bottom: 24px; }
    .section h2 { font-size: 16px; font-weight: 600; color: #334155; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.05em; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; }
    .card h3 { font-size: 14px; font-weight: 600; margin-bottom: 4px; }
    .card p { font-size: 13px; color: #64748b; }
    .score-circle { display: inline-flex; align-items: center; justify-content: center; width: 64px; height: 64px; border-radius: 50%; font-size: 22px; font-weight: 700; color: white; }
    .skills { display: flex; flex-wrap: wrap; gap: 6px; }
    .skill { padding: 3px 10px; border-radius: 6px; font-size: 12px; font-weight: 500; }
    .skill-matched { background: #dcfce7; color: #166534; }
    .skill-missing { background: #fee2e2; color: #991b1b; }
    .exp-item { margin-bottom: 12px; }
    .exp-item h3 { font-size: 14px; font-weight: 600; }
    .exp-item .company { font-size: 13px; color: #64748b; }
    .exp-item .dates { font-size: 12px; color: #94a3b8; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    th { text-align: left; padding: 8px 12px; background: #f1f5f9; font-weight: 600; color: #475569; }
    td { padding: 8px 12px; border-bottom: 1px solid #e2e8f0; }
    .footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #94a3b8; text-align: center; }
    @media print { body { padding: 20px; } }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <h1>${escapeHtml(name)}</h1>
      ${candidate.fileName ? `<p style="color:#64748b;font-size:13px;margin-top:4px;">${escapeHtml(candidate.fileName)}</p>` : ""}
    </div>
    <div class="meta">
      <p><strong>HireLens AI</strong> Screening Report</p>
      <p>${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>
      ${bestScreening ? `<div style="margin-top:8px"><span class="badge ${scoreBadgeClass(bestScreening.match.overallScore)}">${bestScreening.match.overallScore}% match</span></div>` : ""}
    </div>
  </div>

  ${
    bestScreening
      ? `
  <div class="section">
    <h2>Score Breakdown</h2>
    <div class="grid">
      <div class="card" style="text-align:center;">
        <div class="score-circle" style="background:${scoreColor(bestScreening.match.overallScore)};margin:0 auto;">${bestScreening.match.overallScore}</div>
        <p style="margin-top:8px;font-weight:600;">Overall Match</p>
      </div>
      <div class="card">
        <h3>Job: ${escapeHtml(bestJob?.title ?? "Unknown")}</h3>
        ${bestJob?.company ? `<p>${escapeHtml(bestJob.company)}</p>` : ""}
        <p style="margin-top:8px;">Matched: <strong>${bestScreening.match.matchedSkills.length}</strong> skills</p>
        <p>Missing: <strong>${bestScreening.match.missingSkills.length}</strong> skills</p>
      </div>
    </div>
  </div>
  `
      : ""
  }

  <div class="section">
    <h2>Skills</h2>
    <div class="skills">
      ${matchedSkills.map((s) => `<span class="skill skill-matched">${escapeHtml(s)}</span>`).join("")}
      ${missingSkills.map((s) => `<span class="skill skill-missing">${escapeHtml(s)}</span>`).join("")}
      ${matchedSkills.length === 0 && missingSkills.length === 0 ? '<p style="color:#94a3b8;font-size:13px;">No skills data available</p>' : ""}
    </div>
  </div>

  ${
    experience.length > 0
      ? `
  <div class="section">
    <h2>Experience</h2>
    ${experience
      .map(
        (e) => `
    <div class="exp-item">
      <h3>${escapeHtml(e.title ?? "Role")}</h3>
      ${e.company ? `<p class="company">${escapeHtml(e.company)}</p>` : ""}
      ${e.startDate ? `<p class="dates">${escapeHtml(e.startDate)}${e.endDate ? ` — ${escapeHtml(e.endDate)}` : " — Present"}</p>` : ""}
    </div>`,
      )
      .join("")}
  </div>
  `
      : ""
  }

  ${
    education.length > 0
      ? `
  <div class="section">
    <h2>Education</h2>
    ${education
      .map(
        (e) => `
    <div class="exp-item">
      <h3>${escapeHtml(e.degree ?? "Degree")}</h3>
      ${e.institution ? `<p class="company">${escapeHtml(e.institution)}</p>` : ""}
      ${e.graduationYear ? `<p class="dates">${escapeHtml(String(e.graduationYear))}</p>` : ""}
    </div>`,
      )
      .join("")}
  </div>
  `
      : ""
  }

  ${
    certifications.length > 0
      ? `
  <div class="section">
    <h2>Certifications</h2>
    <div class="skills">
      ${certifications.map((c) => `<span class="skill skill-matched">${escapeHtml(c.name)}</span>`).join("")}
    </div>
  </div>
  `
      : ""
  }

  ${
    candidate.screenings.length > 1
      ? `
  <div class="section">
    <h2>All Screenings</h2>
    <table>
      <thead><tr><th>Job</th><th>Score</th><th>Date</th></tr></thead>
      <tbody>
        ${candidate.screenings
          .map((s) => {
            const job = jobs.find((j) => j.id === s.jobId);
            return `<tr><td>${escapeHtml(job?.title ?? "Unknown")}</td><td><strong>${s.match.overallScore}%</strong></td><td>${new Date(s.createdAt).toLocaleDateString()}</td></tr>`;
          })
          .join("")}
      </tbody>
    </table>
  </div>
  `
      : ""
  }

  <div class="footer">
    Generated by HireLens AI · ${new Date().toISOString()} · For internal hiring use only
  </div>

  <script>window.onload = function() { window.print(); }</script>
</body>
</html>`;

  const w = window.open("", "_blank");
  if (w) {
    w.document.write(html);
    w.document.close();
  }
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function scoreColor(score: number): string {
  if (score >= 80) return "#16a34a";
  if (score >= 60) return "#2563eb";
  if (score >= 40) return "#d97706";
  return "#dc2626";
}

function scoreBadgeClass(score: number): string {
  if (score >= 80) return "badge-high";
  if (score >= 60) return "badge-good";
  if (score >= 40) return "badge-fair";
  return "badge-low";
}
