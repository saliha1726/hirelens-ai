/**
 * Deterministic resume parser.
 *
 * Heuristic, explainable extraction of structured profile data from plain
 * resume text: contact info, skills, work experience, education,
 * certifications, seniority and industry domains. No AI involved — the same
 * resume always produces the same profile.
 */
import type {
  Certification,
  Education,
  EducationLevel,
  Experience,
  ParsedResume,
  Seniority,
  Skill,
} from "@/lib/types";
import { canonicalSkillName, extractKnownSkills, skillCategory } from "@/lib/skills/taxonomy";

/* ───────────────────────── Regex bank ───────────────────────── */

const EMAIL_RE = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i;
const PHONE_RE = /(?:\+?\d{1,3}[\s.-]?)?(?:\(\d{2,4}\)[\s.-]?)?\d{3}[\s.-]?\d{3,4}(?:[\s.-]?\d{2,4})?/;
const URL_RE = /(https?:\/\/)?(www\.)?[a-z0-9-]+\.(com|org|net|io|dev|ai|co|me|us|uk)(\/[^\s]*)?/i;

const MONTHS = "jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|sept";
const DATE_RANGE_RE = new RegExp(
  `((?:${MONTHS})[a-z]*\\.?\\s*'?\\d{2,4}|\\d{1,2}/\\d{4}|(?:19|20)\\d{2})\\s*(?:-|–|—|to|until)\\s*((?:${MONTHS})[a-z]*\\.?\\s*'?\\d{2,4}|\\d{1,2}/\\d{4}|(?:19|20)\\d{2}|present|current|now|till date)`,
  "gi",
);

const SECTION_HEADERS: Array<{ key: string; re: RegExp }> = [
  { key: "summary", re: /^(professional\s+)?(summary|profile|objective|about me|career summary|executive summary)\b/i },
  { key: "skills", re: /^((technical|core|key|professional)?\s*skills|technologies|tech stack|competencies|areas of expertise|tools\s*&?\s*technologies)\b/i },
  { key: "experience", re: /^(work\s+|professional\s+|relevant\s+|employment(\s+history)?|experience|career(\s+history)?)\b/i },
  { key: "education", re: /^(education( al)?( background| qualifications)?|academic(s| background| qualifications)?)\b/i },
  { key: "certifications", re: /^(certifications?|licenses?|licen[cs]es|credentials|certificates|training(\s*&?\s*certifications)?)\b/i },
  { key: "projects", re: /^(projects?|selected projects|key projects|personal projects|portfolio)\b/i },
  { key: "awards", re: /^(awards?|honors?|achievements?|recognition)\b/i },
];

const DEGREE_PATTERNS: Array<{ level: EducationLevel; re: RegExp }> = [
  { level: "doctorate", re: /\b(ph\.?\s?d|doctor of philosophy|doctorate|d\.phil)\b/i },
  { level: "master", re: /\b(m\.?s\.?c?\.?(?![a-z])|master(s|'s)?( of| in)?|m\.?b\.?a|m\.?eng|m\.?tech|m\.?phil)\b/i },
  { level: "bachelor", re: /\b(b\.?s\.?c?\.?(?![a-z])|bachelor(s|'s)?( of| in)?|b\.?tech|b\.?e\.?(?![a-z])|b\.?a\.?(?![a-z])|b\.?ba|b\.?com)\b/i },
  { level: "associate", re: /\b(associate(s|'s)?( degree| of)?)\b/i },
  { level: "diploma", re: /\b(diploma|certificate program)\b/i },
  { level: "high-school", re: /\b(high school|ged|secondary school|intermediate)\b/i },
];

const SENIORITY_PATTERNS: Array<{ level: Seniority; re: RegExp }> = [
  { level: "executive", re: /\b(cto|ceo|cfo|coo|chief \w+ officer|vp\b|vice president|head of|director)\b/i },
  { level: "principal", re: /\b(principal|staff engineer|distinguished engineer|architect)\b/i },
  { level: "lead", re: /\b(lead|team lead|tech(nical)? lead|engineering manager|supervisor)\b/i },
  { level: "senior", re: /\b(senior|sr\.?)\b/i },
  { level: "junior", re: /\b(junior|jr\.?|entry[- ]level|associate engineer|graduate)\b/i },
  { level: "intern", re: /\b(intern(ship)?|trainee|co-?op)\b/i },
];

const DOMAIN_KEYWORDS: Record<string, string[]> = {
  fintech: ["fintech", "payment", "banking", "trading platform", "lending", "financial services"],
  ecommerce: ["e-commerce", "ecommerce", "marketplace", "retail", "shopify", "online store"],
  saas: ["saas", "b2b software", "subscription platform"],
  healthcare: ["healthcare", "hospital", "clinic", "pharma", "medical device", "patient", "telehealth", "ehr"],
  education: ["edtech", "education technology", "learning platform", "university", "school district", "curriculum"],
  gaming: ["gaming", "game development", "unity engine", "unreal engine"],
  media: ["media", "streaming", "publishing", "entertainment", "advertising agency"],
  logistics: ["logistics", "supply chain", "shipping", "warehousing", "freight", "transportation"],
  energy: ["energy", "oil and gas", "renewable", "utilities", "power grid"],
  telecom: ["telecom", "telecommunications", "network provider", "isp"],
  government: ["government", "public sector", "municipal", "federal agency"],
  consulting: ["consultancy", "consulting firm", "professional services", "mckinsey", "deloitte", "accenture", "ey ", "kpmg", "pwc"],
  manufacturing: ["manufacturing", "industrial automation", "factory", "automotive"],
  ai_ml: ["artificial intelligence", "machine learning company", "deep learning", "nlp products", "computer vision products"],
  cybersecurity: ["cybersecurity", "information security", "security operations", "penetration testing services"],
  insurance: ["insurance", "insurtech", "underwriting", "claims processing"],
  real_estate: ["real estate", "proptech", "property management"],
  nonprofit: ["nonprofit", "ngo", "charitable"],
};

const KNOWN_CERTS = [
  "AWS Certified Solutions Architect",
  "AWS Certified Developer",
  "AWS Certified SysOps Administrator",
  "AWS Certified Security",
  "AWS Certified Cloud Practitioner",
  "AWS Certified Data Analytics",
  "Azure Administrator Associate",
  "Azure Solutions Architect Expert",
  "Azure AI Engineer Associate",
  "Azure Data Engineer Associate",
  "Google Cloud Professional Cloud Architect",
  "Google Cloud Professional Data Engineer",
  "Google Cloud Associate Cloud Engineer",
  "Certified Kubernetes Administrator",
  "Certified Kubernetes Application Developer",
  "HashiCorp Certified Terraform Associate",
  "Project Management Professional",
  "Certified ScrumMaster",
  "Advanced Certified ScrumMaster",
  "Professional Scrum Master",
  "SAFe Agilist",
  "ITIL Foundation",
  "CISSP",
  "CISM",
  "CompTIA Security+",
  "CompTIA A+",
  "CEH",
  "OSCP",
  "CCNA",
  "CCNP",
  "PMP",
  "CFA",
  "CPA",
  "ACCA",
  "CMA",
  "FRM",
  "Six Sigma Green Belt",
  "Six Sigma Black Belt",
  "Salesforce Certified Administrator",
  "Salesforce Certified Developer",
  "Tableau Desktop Specialist",
  "Microsoft Certified Power BI Data Analyst",
  "Databricks Certified Data Engineer",
  "TensorFlow Developer Certificate",
  "NVIDIA Deep Learning Institute",
  "Registered Nurse",
  "SHRM Certified Professional",
  "PHR Certification",
];

/* ───────────────────────── Helpers ───────────────────────── */

function splitSections(text: string): Map<string, string> {
  const sections = new Map<string, string>();
  const lines = text.split("\n");
  const headerLines = new Map<number, string>();

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.length === 0 || line.length > 60) continue;
    for (const h of SECTION_HEADERS) {
      if (
        h.re.test(line.replace(/[:•\-–—]+$/g, "").trim()) &&
        !EMAIL_RE.test(line)
      ) {
        // Avoid matching body text like "experience with..." — require the line
        // to be short-ish and not end mid-sentence.
        if (!/\w$/.test(line) || line.length < 40 || /^[A-Z][A-Z\s&/]+$/.test(line)) {
          headerLines.set(i, h.key);
        }
        break;
      }
    }
  }

  const sorted = [...headerLines.entries()].sort((a, b) => a[0] - b[0]);
  const boundaries: Array<{ start: number; key: string }> = [];
  for (let i = 0; i < sorted.length; i++) {
    const [lineNo, key] = sorted[i];
    // Skip duplicate consecutive headers of same key
    if (boundaries.length && boundaries[boundaries.length - 1].key === key) continue;
    boundaries.push({ start: i + 1 === sorted.length ? lines.length : sorted[i + 1][0], key });
    const end = i + 1 === sorted.length ? lines.length : sorted[i + 1][0];
    const body = lines.slice(lineNo + 1, end).join("\n").trim();
    sections.set(key, (sections.get(key) ? sections.get(key) + "\n" : "") + body);
  }
  return sections;
}

function monthToNum(m: string): number {
  const names = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
  return Math.max(0, names.indexOf(m.slice(0, 3).toLowerCase()));
}

function parseDateToken(token: string): { year: number; month: number } | null {
  const t = token.trim().toLowerCase().replace(/'/g, "");
  let m = t.match(/([a-z]+)\s*(\d{2,4})/);
  if (m) {
    const year = m[2].length === 2 ? 2000 + parseInt(m[2], 10) : parseInt(m[2], 10);
    return { year, month: monthToNum(m[1]) };
  }
  m = t.match(/(\d{1,2})\/(\d{4})/);
  if (m) return { year: parseInt(m[2], 10), month: parseInt(m[1], 10) - 1 };
  m = t.match(/^((?:19|20)\d{2})$/);
  if (m) return { year: parseInt(m[1], 10), month: 0 };
  return null;
}

function monthsBetween(from: { year: number; month: number }, to: { year: number; month: number }): number {
  return Math.max(0, (to.year - from.year) * 12 + (to.month - from.month));
}

function mergeIntervals(intervals: Array<[number, number]>): Array<[number, number]> {
  if (intervals.length === 0) return [];
  const sorted = [...intervals].sort((a, b) => a[0] - b[0]);
  const merged: Array<[number, number]> = [sorted[0]];
  for (let i = 1; i < sorted.length; i++) {
    const last = merged[merged.length - 1];
    if (sorted[i][0] <= last[1]) last[1] = Math.max(last[1], sorted[i][1]);
    else merged.push(sorted[i]);
  }
  return merged;
}

/** Convert an absolute month-index (year*12+month) into total months now. */
function nowIndex(): number {
  return new Date().getFullYear() * 12 + new Date().getMonth();
}

function parseExperienceSection(section: string): Experience[] {
  const out: Experience[] = [];
  const lines = section.split("\n").map((l) => l.trim()).filter(Boolean);

  // Group lines by date-range occurrences.
  const entries: Array<{ startLine: number; endLine: number; match: RegExpExecArray }> = [];
  for (let i = 0; i < lines.length; i++) {
    DATE_RANGE_RE.lastIndex = 0;
    const m = DATE_RANGE_RE.exec(lines[i]);
    if (m) entries.push({ startLine: Math.max(0, i - 2), endLine: i + 1, match: m });
  }

  for (let e = 0; e < entries.length; e++) {
    const entry = entries[e];
    const nextStart = e + 1 < entries.length ? entries[e + 1].startLine : undefined;
    const chunkLines =
      nextStart != null ? lines.slice(entry.startLine, Math.min(nextStart, entry.endLine + 6)) : lines.slice(entry.startLine, entry.endLine + 6);

    const from = parseDateToken(entry.match[1]);
    const toRaw = entry.match[2];
    const isCurrent = /present|current|now|till date/i.test(toRaw);
    const to = isCurrent ? null : parseDateToken(toRaw);

    let durationMonths: number | undefined;
    if (from) {
      const endIdx = isCurrent ? nowIndex() : to ? to.year * 12 + to.month : undefined;
      if (endIdx != null) durationMonths = monthsBetween({ year: from.year, month: from.month }, { year: Math.floor(endIdx / 12), month: endIdx % 12 });
    }

    // Title/company heuristics: look at lines before the date line.
    const contextLines = chunkLines.filter(
      (l) => l !== entry.match[0] && !URL_RE.test(l) && !EMAIL_RE.test(l),
    );
    let title: string | undefined;
    let company: string | undefined;

    for (const l of contextLines) {
      const atMatch = l.match(/^(.{3,60}?)\s+(?:at|@|,|-|–|•|\|)\s+(.{2,50})$/) || l.match(/^(.{2,50}),\s*(.{2,50})$/);
      if (atMatch && !title) {
        title = atMatch[1].replace(/^[-•*\s]+/, "").trim();
        company = atMatch[2].trim();
        break;
      }
    }
    if (!title && contextLines.length > 0) {
      title = contextLines[contextLines.length - 1].replace(/^[-•*\s]+/, "").trim() || undefined;
    }

    const highlights = chunkLines
      .filter((l) => /^[-•*·]/.test(l.trim()))
      .map((l) => l.replace(/^[-•*·]\s*/, "").trim())
      .filter((l) => l.length > 15)
      .slice(0, 5);

    if (!title && durationMonths == null) continue;

    out.push({
      title: title?.slice(0, 80),
      company: company?.slice(0, 60),
      startDate: from ? `${from.year}-${String(from.month + 1).padStart(2, "0")}` : undefined,
      endDate: isCurrent ? "present" : to ? `${to.year}-${String(to.month + 1).padStart(2, "0")}` : undefined,
      current: isCurrent || undefined,
      durationMonths,
      highlights: highlights.length ? highlights : undefined,
    });
  }
  return out.slice(0, 12);
}

function parseEducationSection(section: string): Education[] {
  const out: Education[] = [];
  const blocks = section.split(/\n(?=[A-Z•\-(])/).map((b) => b.trim()).filter(Boolean);

  for (const block of blocks.slice(0, 8)) {
    let level: EducationLevel | undefined;
    let degree: string | undefined;
    for (const d of DEGREE_PATTERNS) {
      const m = block.match(d.re);
      if (m) {
        level = d.level;
        degree = block.split("\n")[0].slice(0, 90);
        break;
      }
    }
    if (!level) continue;

    const fieldMatch = block.match(
      /\b(?:in|of)\s+([A-Z][A-Za-z&\s]{2,45}?)(?=[,\n]|\bfrom\b|$)/,
    );
    const instMatch = block.match(
      /\b(?:from|at|,\s*)\s*((?:university|college|institute|school|academy|polytechnic)[A-Za-z\s&'.]{0,50})/i,
    ) || block.match(/((?:[A-Z][A-Za-z&.'-]+\s+){0,3}(?:University|College|Institute|Academy|Polytechnic)[A-Za-z\s&'.]{0,30})/);
    const yearMatch = block.match(/\b((?:19|20)\d{2})\b/);

    out.push({
      level,
      degree,
      field: fieldMatch ? fieldMatch[1].trim() : undefined,
      institution: instMatch ? instMatch[1].trim().slice(0, 80) : undefined,
      graduationYear: yearMatch ? parseInt(yearMatch[1], 10) : undefined,
    });
  }
  return out;
}

function parseCertifications(text: string, certSection?: string): Certification[] {
  const out: Certification[] = [];
  const seen = new Set<string>();
  const scan = (source: string, limit: number) => {
    for (const cert of KNOWN_CERTS) {
      if (out.length >= limit) break;
      const re = new RegExp(cert.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      if (re.test(source) && !seen.has(cert.toLowerCase())) {
        seen.add(cert.toLowerCase());
        const yearMatch = source.match(new RegExp(`${cert.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}[\\s\\S]{0,40}?((?:19|20)\\d{2})`, "i"));
        out.push({ name: cert, year: yearMatch ? parseInt(yearMatch[1], 10) : undefined });
      }
    }
  };
  if (certSection) scan(certSection, 10);
  scan(text, 8);
  // Generic "Certified X" pattern as a catch-all.
  const generic = text.matchAll(/\bcertified\s+((?:[A-Z][A-Za-z]+\s+){0,3}[A-Z][A-Za-z]+)/g);
  for (const m of generic) {
    if (out.length >= 12) break;
    const name = `Certified ${m[1].trim()}`;
    if (!seen.has(name.toLowerCase())) {
      seen.add(name.toLowerCase());
      out.push({ name: name.slice(0, 70) });
    }
  }
  return out;
}

function inferSeniority(experience: Experience[]): Seniority {
  const titles = experience.map((e) => e.title ?? "").join(" ");
  for (const p of SENIORITY_PATTERNS) {
    if (p.re.test(titles)) return p.level;
  }
  return "mid";
}

function detectDomains(text: string): string[] {
  const lower = text.toLowerCase();
  const hits: string[] = [];
  for (const [domain, kws] of Object.entries(DOMAIN_KEYWORDS)) {
    if (kws.some((k) => lower.includes(k))) hits.push(domain);
  }
  return hits.slice(0, 5);
}

function extractContactInfo(text: string) {
  const head = text.slice(0, 1200);
  const email = head.match(EMAIL_RE)?.[0];
  const phoneMatch = head.match(PHONE_RE)?.[0]?.trim();
  const phone = phoneMatch && phoneMatch.replace(/\D/g, "").length >= 7 ? phoneMatch : undefined;

  const locMatch =
    head.match(/^(?:location|address|based in)\s*[:\-]\s*(.{3,60})$/im)?.[1] ??
    head.match(/\b([A-Z][a-zA-Z.'-]+(?:\s[A-Z][a-zA-Z.'-]+)*),\s*([A-Z]{2}|[A-Z][a-zA-Z]+)\b/)?.[0];
  const location = locMatch && !URL_RE.test(locMatch) ? locMatch.slice(0, 60) : undefined;

  // Name: first plausible personal-name line before any section content.
  let name: string | undefined;
  const lines = head.split("\n").map((l) => l.trim()).filter(Boolean);
  for (const line of lines.slice(0, 6)) {
    const cleaned = line.replace(/[|•,].*$/, "").trim();
    if (
      /^[A-Z][a-z'’-]+(?:\s+[A-Z][a-z'’.-]+){0,3}$/.test(cleaned) &&
      !EMAIL_RE.test(cleaned) &&
      !/\d/.test(cleaned) &&
      !SECTION_HEADERS.some((h) => h.re.test(cleaned)) &&
      !/resume|curriculum vitae|cv\b/i.test(cleaned) &&
      cleaned.split(" ").length <= 4
    ) {
      name = cleaned;
      break;
    }
  }
  return { name, email, phone, location };
}

function extractSummary(summarySection?: string): string | undefined {
  if (!summarySection) return undefined;
  const firstPara = summarySection.split("\n\n")[0].replace(/\n/g, " ").trim();
  if (firstPara.length < 40) return undefined;
  return firstPara.slice(0, 400);
}

/* ───────────────────────── Main entry ───────────────────────── */

export function parseResume(rawText: string): ParsedResume {
  const warnings: string[] = [];
  const sections = splitSections(rawText);
  const contact = extractContactInfo(rawText);
  const summary = extractSummary(sections.get("summary"));

  // Skills: taxonomy scan over the whole document + explicit skills section.
  const skillNames = new Set<string>(extractKnownSkills(rawText));
  const skillsSection = sections.get("skills");
  if (skillsSection) {
    for (const name of extractKnownSkills(skillsSection)) skillNames.add(name);
  }
  const skills: Skill[] = [...skillNames]
    .map((n) => ({ name: canonicalSkillName(n), category: skillCategory(n) }))
    .sort((a, b) => a.name.localeCompare(b.name));

  const experience = parseExperienceSection(sections.get("experience") ?? rawText);
  const education = parseEducationSection(sections.get("education") ?? rawText);
  const certifications = parseCertifications(rawText, sections.get("certifications"));

  // Total years: merged intervals of dated experience; fallback to earliest year.
  let totalYearsExperience: number | undefined;
  const now = nowIndex();
  const intervals: Array<[number, number]> = [];
  for (const exp of experience) {
    if (!exp.startDate) continue;
    const [y, m] = exp.startDate.split("-").map(Number);
    const startIdx = y * 12 + (m - 1);
    const endIdx =
      exp.endDate === "present"
        ? now
        : exp.endDate
          ? (() => {
              const [ey, em] = exp.endDate.split("-").map(Number);
              return ey * 12 + (em - 1);
            })()
          : undefined;
    if (endIdx != null && endIdx >= startIdx) intervals.push([startIdx, endIdx]);
  }
  if (intervals.length) {
    const totalMonths = mergeIntervals(intervals).reduce(
      (sum, [s, e]) => sum + (e - s),
      0,
    );
    totalYearsExperience = Math.round((totalMonths / 12) * 10) / 10;
    if (totalYearsExperience === 0 && intervals.length) {
      totalYearsExperience = 0.3; // recent graduate with brief stints
    }
  } else {
    const years = rawText.match(/\b((?:19|20)\d{2})\b/g) ?? [];
    const numericYears = years.map(Number).filter((y) => y <= new Date().getFullYear());
    const earliest = numericYears.length ? Math.min(...numericYears) : undefined;
    if (earliest && new Date().getFullYear() - earliest > 0 && new Date().getFullYear() - earliest < 45) {
      totalYearsExperience = new Date().getFullYear() - earliest;
      warnings.push("Experience timeline inferred from years found in the resume.");
    }
  }

  if (!contact.email) warnings.push("No email address detected.");
  if (experience.length === 0) warnings.push("No dated work experience detected.");
  if (skills.length === 0) warnings.push("No recognizable skills found.");
  if (rawText.replace(/\s/g, "").length < 200) warnings.push("Resume text is very short.");

  const confidence = Math.max(
    0,
    Math.min(
      1,
      0.25 +
        (contact.email ? 0.2 : 0) +
        (contact.name ? 0.15 : 0) +
        (experience.length ? 0.2 : 0) +
        (skills.length ? 0.15 : 0) +
        (education.length ? 0.05 : 0),
    ),
  );

  return {
    ...contact,
    summary,
    skills,
    experience,
    education,
    certifications,
    totalYearsExperience,
    seniority: inferSeniority(experience),
    domains: detectDomains(rawText),
    rawTextLength: rawText.length,
    confidence: Math.round(confidence * 100) / 100,
    parseWarnings: warnings,
  };
}
