/**
 * HireLens AI — core domain types.
 *
 * The data model is deliberately clean and storage-agnostic so that
 * authentication, organizations and a server-side database can be layered in
 * later without breaking the deterministic scoring engine.
 */

export type Seniority =
  | "intern"
  | "junior"
  | "mid"
  | "senior"
  | "lead"
  | "principal"
  | "director"
  | "executive";

export type EducationLevel =
  | "none"
  | "high-school"
  | "diploma"
  | "associate"
  | "bachelor"
  | "master"
  | "doctorate";

export interface Skill {
  /** Canonical skill name, e.g. "React", "Kubernetes". */
  name: string;
  category?: string;
}

export interface Experience {
  /** Titles are often ambiguous in free-form resumes, so this is optional. */
  title?: string;
  company?: string;
  startDate?: string;
  endDate?: string;
  current?: boolean;
  durationMonths?: number;
  highlights?: string[];
}

export interface Education {
  degree?: string;
  field?: string;
  institution?: string;
  graduationYear?: number;
  level: EducationLevel;
}

export interface Certification {
  name: string;
  issuer?: string;
  year?: number;
}

/** Structured profile extracted from a resume. */
export interface ParsedResume {
  name?: string;
  email?: string;
  phone?: string;
  location?: string;
  summary?: string;
  skills: Skill[];
  experience: Experience[];
  education: Education[];
  certifications: Certification[];
  totalYearsExperience?: number;
  seniority?: Seniority;
  domains: string[];
  rawTextLength: number;
  /** Parse quality signal for the UI (0–1). */
  confidence: number;
  parseWarnings: string[];
}

export interface WeightedSkill extends Skill {
  weight?: number;
}

export interface JobRequirements {
  id: string;
  title: string;
  company?: string;
  requiredSkills: WeightedSkill[];
  preferredSkills: WeightedSkill[];
  minYearsExperience?: number;
  educationRequirement?: {
    level: EducationLevel;
    field?: string;
    strict?: boolean;
  };
  certificationRequirements: string[];
  seniorityTarget?: Seniority;
  keywords: string[];
  domains: string[];
  responsibilities?: string[];
  sourceLength?: number;
  createdAt: string;
}

/* ────────────────────────── Scoring ────────────────────────── */

export type FactorKey =
  | "requiredSkills"
  | "relevantExperience"
  | "yearsExperience"
  | "preferredSkills"
  | "education"
  | "certifications"
  | "keywords";

export interface FactorScore {
  key: FactorKey;
  label: string;
  /** 0–100 */
  score: number;
  /** Share of the overall score (weights sum to 100). */
  weight: number;
  /** Human-readable one-line explanation. */
  detail: string;
}

export interface StrengthItem {
  label: string;
  evidence?: string;
}

export type GapSeverity = "critical" | "moderate" | "minor";

export interface GapItem {
  label: string;
  severity: GapSeverity;
  detail?: string;
}

export interface EvidenceSpan {
  term: string;
  quote: string;
}

export interface ExperienceComparison {
  requiredYears?: number;
  candidateYears?: number;
  verdict: "meets" | "exceeds" | "below" | "unknown";
  detail: string;
}

/** Deterministic match result — computed entirely without AI. */
export interface MatchResult {
  /** Overall compatibility 0–100. Deterministic & explainable. */
  overallScore: number;
  factors: FactorScore[];
  strengths: StrengthItem[];
  gaps: GapItem[];
  missingSkills: string[];
  matchedSkills: string[];
  skillGaps: { preferred: string[]; partial: string[] };
  experienceComparison: ExperienceComparison;
  keywordHits: string[];
  evidence: EvidenceSpan[];
}

/** AI-generated qualitative interpretation (never the score itself). */
export interface AIInsight {
  summary: string;
  topStrengths: string[];
  concerns: string[];
  interviewFocus: string[];
  recommendationBand:
    | "strong-match"
    | "good-match"
    | "possible-match"
    | "weak-match";
  modelUsed: string;
}

export type ScreeningStatus =
  | "new"
  | "screening"
  | "shortlisted"
  | "interview"
  | "rejected"
  | "hired";

export interface RecruiterNote {
  id: string;
  text: string;
  createdAt: string;
}

/** One candidate = parsed resume + screening results against jobs. */
export interface Candidate {
  id: string;
  fileName?: string;
  resume: ParsedResume;
  screenings: ScreeningRecord[];
  notes: RecruiterNote[];
  status: ScreeningStatus;
  createdAt: string;
}

export interface ScreeningRecord {
  id: string;
  jobId: string;
  jobTitle: string;
  match: MatchResult;
  aiInsight?: AIInsight;
  aiError?: string;
  createdAt: string;
}

export interface ActivityEntry {
  id: string;
  kind: "screen" | "job-created" | "note" | "status-change";
  message: string;
  at: string;
}

export interface WorkspaceData {
  version: number;
  jobs: JobRequirements[];
  candidates: Candidate[];
  activity: ActivityEntry[];
}
