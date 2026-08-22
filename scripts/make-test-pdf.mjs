// Generates a simple single-page text PDF resume for testing.
import { writeFileSync } from "fs";

const lines = [
  "John Tester",
  "john.tester@example.com | +1 (555) 010-2030",
  "",
  "Skills: React, TypeScript, Node.js, PostgreSQL, Docker",
  "",
  "Experience",
  "Software Engineer at TestCorp",
  "Jan 2021 - Present",
  "- Built React dashboards used by 5k users",
  "",
  "Education: B.S. in Computer Science from MIT - 2020",
];

const content = `BT /F1 12 Tf 14 TL 50 760 Td\n${lines
  .map((l) => `(${l.replace(/([()\\])/g, "\\$1")}) Tj T*`)
  .join("\n")}\nET`;

const objs = [
  "<< /Type /Catalog /Pages 2 0 R >>",
  "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
  "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>",
  `<< /Length ${Buffer.byteLength(content)} >>\nstream\n${content}\nendstream`,
  "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
];

let pdf = "%PDF-1.4\n";
const offsets = [];
objs.forEach((body, i) => {
  offsets.push(Buffer.byteLength(pdf));
  pdf += `${i + 1} 0 obj\n${body}\nendobj\n`;
});
const xrefStart = Buffer.byteLength(pdf);
pdf += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n`;
for (const off of offsets) pdf += `${String(off).padStart(10, "0")} 00000 n \n`;
pdf += `trailer\n<< /Size ${objs.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;

writeFileSync("scripts/test-resume.pdf", pdf, "latin1");
console.log("PDF written:", Buffer.byteLength(pdf), "bytes");
