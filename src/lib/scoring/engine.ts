/**
 * Deterministic scoring engine.
 *
 * The overall compatibility score is computed here — pure TypeScript, no AI,
 * no randomness, fully explainable. AI is layered ON TOP for qualitative
 * interpretation only (see src/lib/ai) and can never move the number.
 *
 * Factor weights sum to 100 so the weighted average is the overall score.
 */
import type {
  EducationLevel,
  EvidenceSpan,
  ExperienceComparison,
  FactorScore,
  GapItem,
  JobRequirements,
  MatchResult,
  ParsedResume,
  StrengthItem,
} from "@/lib/types";
import { canonicalSkillName } from "@/lib/skills/taxonomy";

export const FACTOR_WEIGHTS = {
  requiredSkills: 40,
  relevantExperience: 18,
  yearsExperience: 12,
  preferredSkills: 10,
  education: 8,
  certifications: 6,
  keywords: 6,
} as const;

export const FACTOR_LABELS: Record<keyof typeof FACTOR_WEIGHTS, string> = {
  requiredSkills: "Required skills",
  relevantExperience: "Relevant experience",
  yearsExperience: "Years of experience",
  preferredSkills: "Preferred skills",
  education: "Education",
  certifications: "Certifications",
  keywords: "Job-specific keywords",
};

const EDUCATION_RANK: Record<EducationLevel, number> = {
  none: 0,
  "high-school": 1,
  diploma: 2,
  associate: 3,
  bachelor: 4,
  master: 5,
  doctorate: 6,
};

function clamp(n: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, n));
}

/** Word-boundary-aware containment check. */
function containsTerm(haystackLower: string, term: string): boolean {
  const t = term.trim().toLowerCase();
  if (!t) return false;
  const escaped = t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(^|[^a-z0-9+#])${escaped}([^a-z0-9+#]|$)`, "i").test(
    haystackLower,
  );
}

/** Pull short quotes around evidence hits for the UI. */
function findEvidence(resumeTextLower: string, originalText: string, terms: string[]): EvidenceSpan[] {
  const out: EvidenceSpan[] = [];
  for (const term of terms.slice(0, 12)) {
    const idx = resumeTextLower.indexOf(term.trim().toLowerCase());
    if (idx === -1 || !originalText) continue;
    const start = Math.max(0, idx - 70);
    const end = Math.min(originalText.length, idx + term.length + 70);
    let quote = originalText.slice(start, end).replace(/\s+/g, " ").trim();
    if (start > 0) quote = "…" + quote;
    if (end < originalText.length) quote = quote + "…";
    if (!out.some((e) => e.term === term)) out.push({ term, quote });
  }
  return out;
}

/* ─────────────────────────── Factors ─────────────────────────── */

function scoreRequiredSkills(
  resume: ParsedResume,
  resumeText: string,
  job: JobRequirements,
): { score: number; matched: string[]; missing: string[]; partial: string[] } {
  const required = job.requiredSkills.map((s) => canonicalSkillName(s.name));
  if (required.length === 0)
    return { score: 100, matched: [], missing: [], partial: [] };

  const resumeSkills = new Set(resume.skills.map((s) => s.name.toLowerCase()));
  const textLower = resumeText.toLowerCase();

  const matched: string[] = [];
  const missing: string[] = [];
  const partial: string[] = [];

  for (const skill of required) {
    const direct =
      resumeSkills.has(skill.toLowerCase()) ||
      containsTerm(textLower, skill);
    // Partial credit: token overlap for multi-word skills, e.g. "Node.js" vs "node".
    const tokens = skill.toLowerCase().split(/[^a-z0-9+#]+/).filter((t) => t.length > 2);
    const hitTokens = tokens.filter((t) =>
      resume.skills.some((s) => s.name.toLowerCase().includes(t)),
    );
    if (direct) {
      matched.push(skill);
    } else if (tokens.length > 1 && hitTokens.length >= Math.ceil(tokens.length / 2)) {
      partial.push(skill);
    } else {
      missing.push(skill);
    }
  }

  const coverage =
    (matched.length + 0.5 * partial.length) / required.length;
  return { score: Math.round(clamp(coverage * 100)), matched, missing, partial };
}

function scorePreferredSkills(
  resume: ParsedResume,
  resumeText: string,
  job: JobRequirements,
): { score: number; matched: string[]; missing: string[] } {
  const preferred = job.preferredSkills.map((s) => canonicalSkillName(s.name));
  if (preferred.length === 0)
    return { score: 100, matched: [], missing: [] };

  const textLower = resumeText.toLowerCase();
  const matched: string[] = [];
  const missing: string[] = [];
  for (const skill of preferred) {
    const hit =
      resume.skills.some((s) => s.name.toLowerCase() === skill.toLowerCase()) ||
      containsTerm(textLower, skill);
    (hit ? matched : missing).push(skill);
  }
  return { score: Math.round(clamp((matched.length / preferred.length) * 100)), matched, missing };
}

function seniorityIndex(s?: string): number {
  const order = ["intern", "junior", "mid", "senior", "lead", "principal", "director", "executive"];
  const i = s ? order.indexOf(s) : -1;
  return i === -1 ? 2 : i; // default mid
}

function scoreRelevantExperience(
  resume: ParsedResume,
  resumeText: string,
  job: JobRequirements,
): { score: number; detail: string } {
  const domainTerms = [...new Set([...job.domains, ...job.keywords])]
    .filter(Boolean)
    .slice(0, 20);

  // Relevance = how strongly the candidate's actual role titles & experience
  // narrative overlap with the job's domain/keyword vocabulary.
  const titleText = resume.experience
    .map((e) => `${e.title ?? ""} ${e.company ?? ""}`)
    .join(" ")
    .toLowerCase();
  const fullText = resumeText.toLowerCase();

  let titleHits = 0;
  for (const t of domainTerms) if (containsTerm(titleText, t)) titleHits++;
  let fullHits = 0;
  for (const t of domainTerms) if (containsTerm(fullText, t)) fullHits++;

  const denom = Math.max(1, domainTerms.length);
  const relevance = clamp((titleHits / denom) * 60 + (fullHits / denom) * 40);

  // Seniority alignment: being within one band of target is neutral-good.
  const target = seniorityIndex(job.seniorityTarget);
  const actual = seniorityIndex(resume.seniority);
  const delta = Math.abs(target - actual);
  const seniorityFactor = delta <= 1 ? 100 : delta === 2 ? 70 : 45;

  const score = Math.round(relevance * 0.65 + seniorityFactor * 0.35);
  const detail =
    `${titleHits}/${domainTerms.length} role-relevant signals found` +
    (job.seniorityTarget
      ? ` · seniority ${resume.seniority ?? "mid"} vs target ${job.seniorityTarget}`
      : "");
  return { score, detail };
}

function scoreYearsExperience(
  resume: ParsedResume,
  job: JobRequirements,
): { score: number; detail: string; comparison: ExperienceComparison } {
  const required = job.minYearsExperience;
  const actual = resume.totalYearsExperience;

  if (required == null && actual == null)
    return {
      score: 70,
      detail: "Experience duration could not be determined",
      comparison: {
        verdict: "unknown",
        detail: "Neither the job nor the resume stated a clear experience length.",
      },
    };
  if (required == null)
    return {
      score: 90,
      detail: `≈${actual} years total experience`,
      comparison: {
        requiredYears: undefined,
        candidateYears: actual,
        verdict: "meets",
        detail: `Candidate shows ≈${actual} years; no minimum specified.`,
      },
    };
  if (actual == null)
    return {
      score: 55,
      detail: `Job asks for ${required}+ years; resume timeline unclear`,
      comparison: {
        requiredYears: required,
        candidateYears: undefined,
        verdict: "unknown",
        detail: `Role requires ${required}+ years but the resume timeline was ambiguous.`,
      },
    };

  const ratio = actual / required;
  let score: number;
  let verdict: ExperienceComparison["verdict"];
  if (ratio >= 1.25) {
    score = 100;
    verdict = "exceeds";
  } else if (ratio >= 1) {
    score = 95;
    verdict = "meets";
  } else if (ratio >= 0.85) {
    score = 80;
    verdict = "below";
  } else if (ratio >= 0.6) {
    score = 55 + (ratio - 0.6) * 100; // 55–80
    verdict = "below";
  } else {
    score = clamp(ratio * 90); // steep penalty far below
    verdict = "below";
  }

  const detail =
    verdict === "exceeds"
      ? `≈${actual} yrs vs ${required}+ required — exceeds`
      : verdict === "meets"
        ? `≈${actual} yrs vs ${required}+ required — meets`
        : `≈${actual} yrs vs ${required}+ required — below`;

  return {
    score: Math.round(score),
    detail,
    comparison: {
      requiredYears: required,
      candidateYears: actual,
      verdict,
      detail,
    },
  };
}

function scoreEducation(
  resume: ParsedResume,
  job: JobRequirements,
): { score: number; detail: string } {
  const req = job.educationRequirement;
  const best = resume.education.reduce<EducationLevel>(
    (acc, e) => (EDUCATION_RANK[e.level] > EDUCATION_RANK[acc] ? e.level : acc),
    "none",
  );

  if (!req || req.level === "none") {
    return best === "none"
      ? { score: 75, detail: "No explicit education requirement" }
      : { score: 95, detail: `Highest: ${best}` };
  }

  const rankDiff = EDUCATION_RANK[best] - EDUCATION_RANK[req.level];
  let fieldMatch = true;
  if (req.field) {
    const fieldLower = req.field.toLowerCase();
    fieldMatch = resume.education.some((e) => {
      const f = `${e.field ?? ""} ${e.degree ?? ""}`.toLowerCase();
      return f.includes(fieldLower.split(" ")[0]) || f.includes(fieldLower);
    });
  }

  if (rankDiff >= 0) {
    const score = fieldMatch ? (rankDiff > 0 ? 100 : 97) : req.strict ? 78 : 88;
    return {
      score,
      detail:
        `Holds ${best}` +
        (req.field ? (fieldMatch ? ` in a related field (${req.field})` : ` — field differs (${req.field} requested)`) : ""),
    };
  }
  // Below requirement
  const gap = -rankDiff;
  const score = req.strict ? clamp(50 - gap * 15) : clamp(70 - gap * 12);
  return {
    score,
    detail: `Holds ${best}, role prefers ${req.level}${req.field ? ` in ${req.field}` : ""}`,
  };
}

function scoreCertifications(
  resume: ParsedResume,
  resumeText: string,
  job: JobRequirements,
): { score: number; matched: string[]; missing: string[] } {
  const required = job.certificationRequirements;
  if (required.length === 0) return { score: 100, matched: [], missing: [] };

  const textLower = resumeText.toLowerCase();
  const certNames = resume.certifications.map((c) => c.name.toLowerCase());
  const matched: string[] = [];
  const missing: string[] = [];
  for (const req of required) {
    const hit =
      certNames.some((c) => c.includes(req.toLowerCase()) || req.toLowerCase().includes(c)) ||
      containsTerm(textLower, req);
    (hit ? matched : missing).push(req);
  }
  return { score: Math.round(clamp((matched.length / required.length) * 100)), matched, missing };
}

function scoreKeywords(
  resume: ParsedResume,
  resumeText: string,
  job: JobRequirements,
): { score: number; hits: string[] } {
  const kws = job.keywords.filter((k) => k.length > 2).slice(0, 25);
  if (kws.length === 0) return { score: 85, hits: [] };
  const textLower = resumeText.toLowerCase();
  const hits = kws.filter((k) => containsTerm(textLower, k));
  return {
    score: Math.round(clamp((hits.length / kws.length) * 100)),
    hits,
  };
}

/* ─────────────────────── Main entry point ─────────────────────── */

export function computeMatch(
  resume: ParsedResume,
  job: JobRequirements,
  rawResumeText: string,
): MatchResult {
  const w = { ...FACTOR_WEIGHTS, ...job.weightOverrides };
  const req = scoreRequiredSkills(resume, rawResumeText, job);
  const pref = scorePreferredSkills(resume, rawResumeText, job);
  const rel = scoreRelevantExperience(resume, rawResumeText, job);
  const years = scoreYearsExperience(resume, job);
  const edu = scoreEducation(resume, job);
  const certs = scoreCertifications(resume, rawResumeText, job);
  const kw = scoreKeywords(resume, rawResumeText, job);

  const factors: FactorScore[] = [
    { key: "requiredSkills", label: FACTOR_LABELS.requiredSkills, weight: w.requiredSkills, score: req.score, detail: req.matched.length ? `${req.matched.length}/${job.requiredSkills.length} required skills matched` : "No required skills matched" },
    { key: "relevantExperience", label: FACTOR_LABELS.relevantExperience, weight: w.relevantExperience, score: rel.score, detail: rel.detail },
    { key: "yearsExperience", label: FACTOR_LABELS.yearsExperience, weight: w.yearsExperience, score: years.score, detail: years.detail },
    { key: "preferredSkills", label: FACTOR_LABELS.preferredSkills, weight: w.preferredSkills, score: pref.score, detail: job.preferredSkills.length ? `${pref.matched.length}/${job.preferredSkills.length} preferred skills matched` : "No preferred skills specified" },
    { key: "education", label: FACTOR_LABELS.education, weight: w.education, score: edu.score, detail: edu.detail },
    { key: "certifications", label: FACTOR_LABELS.certifications, weight: w.certifications, score: certs.score, detail: job.certificationRequirements.length ? `${certs.matched.length}/${job.certificationRequirements.length} certifications matched` : "No certifications required" },
    { key: "keywords", label: FACTOR_LABELS.keywords, weight: w.keywords, score: kw.score, detail: job.keywords.length ? `${kw.hits.length}/${Math.min(job.keywords.length, 25)} keyword signals present` : "Insufficient keywords extracted" },
  ];

  const overall = Math.round(
    factors.reduce((sum, f) => sum + f.score * f.weight, 0) /
      factors.reduce((sum, f) => sum + f.weight, 0),
  );

  /* Strengths & gaps derived from factor details — never invented. */
  const strengths: StrengthItem[] = [];
  const gaps: GapItem[] = [];

  for (const f of factors) {
    if (f.score >= 85)
      strengths.push({ label: strongLabel(f.key, f.detail, req.matched, certs.matched), evidence: f.detail });
    else if (f.score < 60)
      gaps.push({ label: weakLabel(f.key, req.missing, certs.missing), severity: severityFor(f.key, f.weight, f.score), detail: f.detail });
  }

  const evidence = findEvidence(rawResumeText.toLowerCase(), rawResumeText, [
    ...req.matched.slice(0, 8),
    ...kw.hits.slice(0, 5),
  ]);

  return {
    overallScore: clamp(overall),
    factors,
    strengths,
    gaps,
    missingSkills: req.missing,
    matchedSkills: req.matched,
    skillGaps: { preferred: pref.missing, partial: req.partial },
    experienceComparison: years.comparison,
    keywordHits: kw.hits,
    evidence,
  };
}

function severityFor(key: string, weight: number, score: number): GapItem["severity"] {
  const impact = (weight * (100 - score)) / 100;
  if (key === "requiredSkills" && score < 50) return "critical";
  if (impact >= 12) return "critical";
  if (impact >= 6) return "moderate";
  return "minor";
}

function strongLabel(key: string, _detail: string, matched: string[], certsMatched: string[]): string {
  switch (key) {
    case "requiredSkills":
      return matched.length > 3
        ? `Strong skill coverage (${matched.slice(0, 3).join(", ")})`
        : `Covers key requirements`;
    case "relevantExperience":
      return "Directly relevant experience";
    case "yearsExperience":
      return "Experience exceeds bar";
    case "preferredSkills":
      return "Bonus skills present";
    case "education":
      return "Education meets bar";
    case "certifications":
      return `Relevant certifications${certsMatched.length ? ` (${certsMatched[0]})` : ""}`;
    case "keywords":
      return "Strong keyword/domain alignment";
    default:
      return key;
  }
}

function weakLabel(key: string, missing: string[], certsMissing: string[]): string {
  switch (key) {
    case "requiredSkills":
      return `Missing: ${missing.slice(0, 3).join(", ")}`;
    case "relevantExperience":
      return "Limited role-specific experience";
    case "yearsExperience":
      return "Below experience bar";
    case "preferredSkills":
      return "Few preferred/bonus skills";
    case "education":
      return "Education below preference";
    case "certifications":
      return `Missing certifications: ${certsMissing.slice(0, 2).join(", ")}`;
    case "keywords":
      return "Weak domain keyword overlap";
    default:
      return key;
  }
}
