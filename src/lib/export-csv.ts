import type { Candidate } from "@/lib/types";

export function exportCandidatesToCSV(candidates: Candidate[]) {
  const headers = [
    "Name",
    "Email",
    "File",
    "Status",
    "Best Score",
    "Job Title",
    "Skills",
    "Experience (yrs)",
    "Education",
    "Created",
  ];

  const rows = candidates.map((c) => {
    const best = c.screenings.length > 0
      ? c.screenings.reduce((acc, s) => (s.match.overallScore > acc.match.overallScore ? s : acc))
      : null;
    return [
      c.resume.name ?? "",
      c.resume.email ?? "",
      c.fileName ?? "",
      c.status,
      best ? String(best.match.overallScore) : "",
      best?.jobTitle ?? "",
      c.resume.skills.map((s) => s.name).join("; "),
      String(c.resume.totalYearsExperience ?? ""),
      c.resume.education.map((e) => `${e.degree ?? ""} ${e.field ?? ""}`).join("; "),
      c.createdAt.slice(0, 10),
    ];
  });

  const csvContent = [
    headers.join(","),
    ...rows.map((row) =>
      row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(","),
    ),
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `hirelens-candidates-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
