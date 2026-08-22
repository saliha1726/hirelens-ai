/**
 * Deterministic job-description parser.
 *
 * Extracts structured requirements from raw JD text: title, required vs
 * preferred skills, minimum years, education, certifications, seniority,
 * salient keywords and industry domains. AI refinement is layered on top
 * separately (see src/lib/ai).
 */
import type { EducationLevel, JobRequirements, Seniority } from "@/lib/types";
import {
  canonicalSkillName,
  extractKnownSkills,
  skillCategory,
} from "@/lib/skills/taxonomy";

/** Extract + normalize to proper canonical casing ("reactjs" → "React"). */
function skillsFrom(text: string): string[] {
  return [...new Set(extractKnownSkills(text).map(canonicalSkillName))];
}

const STOPWORDS = new Set(
  `a an and are as at be by for from has have how in is it its of on or that the to was were will with you your our we they their this those these who whom what when where which why not no yes all any both each few more most other some such only own same so than too very can cannot could should would may might must shall about across after against along among around before behind below beneath beside between beyond during except inside into like near off onto outside over past since through throughout under until up upon via within without work working works role position candidate candidates job jobs team teams company companies experience experienced years year strong excellent good great ability able including include includes using use used us new etc also well plus plus preferred required requirements requirement responsibility responsibilities qualifications skills skill knowledge proficiency proficient familiarity familiar understanding plus bonus nice have must should ideally minimum least least please apply applying application join looking seeking hire hiring offer offers benefits salary compensation full-time part-time remote hybrid onsite office location based day days week weeks month months opportunity opportunities environment culture diverse inclusive equal employer race gender color religion sex orientation identity disability veteran status protected characteristics applicant applicants resume resumes cover letter portfolio references screening interview interviews process stage per annually hourly rate range plus vacation health dental vision insurance retirement plan equity stock options flexible hours parental leave learning development budget equipment home allowance description overview summary intro introduction about us mission values what who why do does did doing get gets got make makes made take takes taken give gives given go goes went come comes came see sees saw look looks looked want wants wanted need needs needed help helps helped let lets start starts started keep keeps kept feel feels felt try tries tried leave leaves left call calls called`
    .split(/\s+/)
    .filter(Boolean),
);

function splitSections(text: string): Map<string, string> {
  const sections = new Map<string, string>();
  const lines = text.split("\n");
  const headerRe =
    /^(requirements?|minimum qualifications?|must[- ]haves?|what (we('re| are) )?(you'll need|you need|we need)|qualifications?|about you|who you are|skills? (and|&)? ?(experience|requirements)?|technical (skills|requirements)|nice[- ]to[- ]haves?|preferred qualifications?|bonus points?|preferred( skills| experience| qualifications)?|desirable|good to have|plus(es)?|responsibilities|what you('ll| will) do|the role|duties)\s*:?\s*$/i;

  const boundaries: Array<{ line: number; key: string }> = [];
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i].trim();
    if (!l || l.length > 60) continue;
    if (headerRe.test(l)) {
      const key = /nice[- ]to[- ]have|preferred|bonus|desirable|good to have|\bplus/i.test(l)
        ? "preferred"
        : /responsibilit|what you('ll| will) do|duties|the role/i.test(l)
          ? "responsibilities"
          : "required";
      boundaries.push({ line: i, key });
    }
  }
  if (boundaries.length === 0) {
    sections.set("body", text);
    return sections;
  }
  // Preamble before first header.
  if (boundaries[0].line > 0)
    sections.set("preamble", lines.slice(0, boundaries[0].line).join("\n"));
  boundaries.forEach((b, i) => {
    const end = i + 1 < boundaries.length ? boundaries[i + 1].line : lines.length;
    const key = sections.has(b.key) ? `${b.key}-${i}` : b.key;
    sections.set(key, lines.slice(b.line + 1, end).join("\n"));
  });
  return sections;
}

function extractTitle(text: string): string {
  const explicit = text.match(/^\s*(?:job\s*title|position|role)\s*[:\-]\s*(.{3,80})$/im);
  if (explicit) return cleanTitle(explicit[1]);
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  for (let i = 0; i < Math.min(lines.length, 6); i++) {
    const l = lines[i];
    if (
      l.length >= 4 &&
      l.length <= 90 &&
      !/\d{3,}/.test(l) &&
      !/^(about|our|at|join|we|company)/i.test(l) &&
      /^[A-Z]/.test(l) &&
      l.split(" ").length <= 10 &&
      !EMAIL_RE.test(l)
    ) {
      return cleanTitle(l);
    }
  }
  // Flat prose fallback: "Growth Marketer role. We need someone..." → "Growth Marketer"
  const firstSentence = text.split(/[.!?\n]/)[0]?.trim() ?? "";
  for (const segment of firstSentence.split(/\s+(?:with|who|and|to)\s+|[,(]/)) {
    const words = segment.trim().split(/\s+/).filter(Boolean);
    if (
      words.length >= 1 &&
      words.length <= 6 &&
      /^[A-Z][a-z]/.test(words[0] ?? "") &&
      !/^(we|our|the|this|join|about|you)$/i.test(words[0])
    ) {
      let candidate = words
        .filter((w) => !/^(role|position|opening|vacancy|required|needed)$/i.test(w))
        .join(" ")
        .trim();
      if (/^[a-z]/.test(candidate)) candidate = candidate.charAt(0).toUpperCase() + candidate.slice(1);
      if (candidate.length >= 3) return candidate.slice(0, 70);
    }
  }
  return "Untitled role";
}

/** Strip company suffixes & parentheticals from a title line. */
function cleanTitle(raw: string): string {
  return raw
    .replace(/\s*\(.*?\)\s*$/, "")
    .replace(/\s+(?:at|@)\s+[A-Z].*$/, "")
    .replace(/[,–—-]\s*[A-Z].*$/, "")
    .replace(/\s*\|\s*.*$/, "")
    .replace(/[,–—-]+\s*$/, "")
    .trim()
    .slice(0, 70);
}

const EMAIL_RE = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i;

function extractMinYears(text: string): number | undefined {
  const m =
    text.match(/(\d{1,2})\s*\+?\s*(?:-\s*\d{1,2}\s*)?(?:years?|yrs?)\s+(?:of\s+)?(?:relevant\s+|professional\s+|hands-on\s+|industry\s+)*(?:work\s+|working\s+)?experience/i) ??
    text.match(/(?:minimum|at least|min\.?)\s+(\d{1,2})\s*(?:years?|yrs?)/i) ??
    text.match(/(\d{1,2})\s*(?:years?|yrs?)[^.]{0,30}(?:experience|background)/i);
  if (!m) return undefined;
  const n = parseInt(m[1], 10);
  return n > 0 && n <= 25 ? n : undefined;
}

const EDU_PATTERNS: Array<{ level: EducationLevel; re: RegExp }> = [
  { level: "doctorate", re: /\b(ph\.?\s?d|doctoral|doctorate)\b/i },
  { level: "master", re: /\b(master(s|'s)?|m\.?s\.?c?\.?|m\.?b\.?a|m\.?tech)\b/i },
  { level: "bachelor", re: /\b(bachelor(s|'s)?|b\.?s\.?c?\.?|b\.?tech|undergraduate degree)\b/i },
  { level: "associate", re: /\bassociate(s|'s)? degree\b/i },
];

function extractEducation(text: string): JobRequirements["educationRequirement"] | undefined {
  for (const p of EDU_PATTERNS) {
    // Field capture only valid from the combined pattern; the bare degree
    // regex's group means something different ("Master's"), never a field.
    const withField = text.match(
      new RegExp(p.re.source + "[^.,\\n]{0,60}?(?:in|of)\\s+(?<field>[A-Za-z][A-Za-z\\s&]{2,40}?)(?=\\s+(?:or|and|from|is|are)\\b|[,.\n]|$)", "i"),
    );
    const bare = text.match(p.re);
    if (!bare) continue;
    const pos = bare.index ?? 0;
    const strict = /\bmust|required|required qualification\b/i.test(
      text.slice(Math.max(0, pos - 80), pos + 120),
    );
    return {
      level: p.level,
      field: withField?.groups?.field?.trim(),
      strict: strict || undefined,
    };
  }
  return undefined;
}

const KNOWN_CERTS_SHORT = [
  "PMP", "CISSP", "CISM", "CEH", "OSCP", "CCNA", "CCNP", "CFA", "CPA", "ACCA",
  "AWS Certified", "Azure Certified", "Google Cloud Certified",
  "Certified Kubernetes", "Certified ScrumMaster", "Professional Scrum Master",
  "ITIL", "Six Sigma", "Salesforce Certified", "CompTIA Security+", "SHRM",
];

function extractCerts(text: string): string[] {
  const out: string[] = [];
  for (const c of KNOWN_CERTS_SHORT) {
    if (new RegExp(c.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i").test(text)) out.push(c);
  }
  const generic = text.matchAll(/(?:certification|certificate)s?\s+(?:in|for|such as|like)\s+((?:[A-Z][A-Za-z+#]+\s*){1,4})/g);
  for (const g of generic) out.push(g[1].trim());
  return [...new Set(out)].slice(0, 6);
}

function extractSeniority(text: string, title: string): Seniority | undefined {
  const hay = `${title} ${text}`.toLowerCase();
  if (/\b(cto|ceo|vp\b|vice president|head of|director of)\b/.test(hay)) return "director";
  if (/\b(principal|staff engineer|architect)\b/.test(hay)) return "principal";
  if (/\b(lead|team lead|manager)\b/.test(hay)) return "lead";
  if (/\bsenior\b|\bsr\.?\b/.test(hay)) return "senior";
  if (/\bjunior\b|\bjr\.?\b|\bentry[- ]level\b|\bgraduate\b/.test(hay)) return "junior";
  if (/\bintern(ship)?\b|\btrainee\b/.test(hay)) return "intern";
  if (/\b\d\+?\s*(?:-|\bto\b)?\s*[23]\s*(?:years?|yrs?)\b/.test(hay)) return "mid";
  return undefined;
}

function extractKeywords(text: string, limit = 20): string[] {
  const freq = new Map<string, number>();
  const words = text.toLowerCase().match(/[a-z][a-z+#.\-/]{2,}/g) ?? [];
  for (const w of words) {
    const cleaned = w.replace(/[.\-/]+$/, "");
    if (STOPWORDS.has(cleaned) || cleaned.length < 4) continue;
    freq.set(cleaned, (freq.get(cleaned) ?? 0) + 1);
  }
  return [...freq.entries()]
    .filter(([w]) => !extractKnownSkills(w).length) // skills counted separately
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([w]) => w);
}

function extractDomains(text: string): string[] {
  const lower = text.toLowerCase();
  const map: Record<string, string[]> = {
    fintech: ["fintech", "payments", "banking"],
    ecommerce: ["e-commerce", "ecommerce", "marketplace"],
    saas: ["saas", "b2b software"],
    healthcare: ["healthcare", "health tech", "medical"],
    education: ["edtech", "education technology"],
    gaming: ["gaming", "game studio"],
    logistics: ["logistics", "supply chain"],
    cybersecurity: ["cybersecurity", "information security"],
    ai_ml: ["artificial intelligence", "machine learning", "ai/ml", "generative ai"],
    insurance: ["insurance", "insurtech"],
    media: ["media & entertainment", "streaming platform"],
  };
  const hits: string[] = [];
  for (const [d, kws] of Object.entries(map)) if (kws.some((k) => lower.includes(k))) hits.push(d);
  return hits;
}

/* ───────────────────────── Main entry ───────────────────────── */

export function parseJobDescription(text: string, id?: string): JobRequirements {
  const sections = splitSections(text);
  const requiredZone = [
    sections.get("required") ?? "",
    sections.get("preamble") ?? "",
    sections.get("body") ?? "",
    !sections.has("required") && !sections.has("body") ? text : "",
  ].join("\n");
  const preferredZone = [sections.get("preferred") ?? "", ...[...sections.keys()].filter((k) => k.startsWith("preferred-")).map((k) => sections.get(k) ?? "")].join("\n");

  const title = extractTitle(text);
  const companyMatch =
    text.match(/^\s*(?:company|employer)\s*[:\-]\s*(.{2,60})$/im) ??
    text.match(/\bat\s+([A-Z][A-Za-z&.'-]+(?:\s[A-Z][A-Za-z&.'-]+){0,3})(?:,|\s+we|\s+is|\s+are|$)/m);
  const company = companyMatch?.[1]?.includes(" ") && companyMatch[1].length < 50 ? companyMatch[1].trim() : undefined;

  // Skills: taxonomy scan. Required zone wins; a skill found only in the
  // preferred/nice-to-have zone counts as preferred.
  const allSkills = skillsFrom(text);
  const requiredSet = new Set(skillsFrom(requiredZone));
  const requiredSkills = [...requiredSet].map((name) => ({ name, category: skillCategory(name) }));
  const preferredSkills = allSkills
    .filter((s) => !requiredSet.has(s))
    .map((name) => ({ name, category: skillCategory(name) }));

  const minYears = extractMinYears(requiredZone || text);
  const educationRequirement = extractEducation(text);
  const certificationRequirements = extractCerts(text);
  const seniorityTarget = extractSeniority(text, title);
  const keywords = extractKeywords(text);
  const domains = extractDomains(text);

  const responsibilities = (sections.get("responsibilities") ?? "")
    .split("\n")
    .map((l) => l.replace(/^[-•*\d.)\s]+/, "").trim())
    .filter((l) => l.length > 15)
    .slice(0, 10);

  return {
    id: id ?? crypto.randomUUID(),
    title,
    company,
    requiredSkills,
    preferredSkills,
    minYearsExperience: minYears,
    educationRequirement,
    certificationRequirements,
    seniorityTarget,
    keywords,
    domains,
    responsibilities: responsibilities.length ? responsibilities : undefined,
    sourceLength: text.length,
    createdAt: new Date().toISOString(),
  };
}
