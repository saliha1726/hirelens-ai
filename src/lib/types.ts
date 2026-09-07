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
  weightOverrides?: Partial<Record<FactorKey, number>>;
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
  type: "general" | "interview" | "feedback" | "screening";
  pinned: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface CandidateTag {
  id: string;
  name: string;
  color: string;
}

export interface Interview {
  id: string;
  scheduledAt: string;
  duration: number; // minutes
  type: "phone" | "video" | "onsite" | "technical";
  notes?: string;
  scorecard?: InterviewScorecard;
  createdAt: string;
}

export interface InterviewScorecard {
  cultureFit: number;       // 1-5
  technicalSkill: number;   // 1-5
  communication: number;    // 1-5
  problemSolving: number;   // 1-5
  leadership: number;       // 1-5
  overallImpression: number; // 1-5
  strengths: string[];
  concerns: string[];
  recommendation: "strong-hire" | "hire" | "lean-hire" | "no-hire" | "strong-no-hire";
  additionalNotes: string;
}

export type TimelineEventKind = "screening" | "status-change" | "note" | "interview" | "tag-added" | "tag-removed";

export interface TimelineEvent {
  id: string;
  kind: TimelineEventKind;
  message: string;
  at: string;
  meta?: Record<string, unknown>;
}

/** One candidate = parsed resume + screening results against jobs. */
export interface Candidate {
  id: string;
  fileName?: string;
  resume: ParsedResume;
  screenings: ScreeningRecord[];
  notes: RecruiterNote[];
  interviews: Interview[];
  tags: CandidateTag[];
  status: ScreeningStatus;
  createdAt: string;
  /** Set when the candidate applied via the public apply link. */
  applicantName?: string;
  applicantEmail?: string;
  applicantPhone?: string;
  /** Unguessable token for the public candidate feedback portal. */
  feedbackToken?: string;
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

/* ────────────────────────── Team collaboration ────────────────────────── */

export type WorkspaceRole = "admin" | "recruiter" | "viewer";

export interface WorkspaceMember {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: WorkspaceRole;
  joinedAt: string;
}

export interface WorkspaceDoc {
  id: string;
  name: string;
  ownerId: string;
  createdAt: string;
}

/* ────────────────────────── Offer tracking ────────────────────────── */

export type OfferStatus = "draft" | "sent" | "accepted" | "declined" | "expired" | "rescinded";

export interface Offer {
  id: string;
  candidateId: string;
  jobId: string;
  status: OfferStatus;
  salary?: number;
  currency: string;
  offerDate: string;
  expectedStartDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

/* ────────────────────────── Onboarding ────────────────────────── */

export type OnboardingTaskStatus = "pending" | "in-progress" | "completed";

export interface OnboardingTask {
  id: string;
  candidateId: string;
  title: string;
  description?: string;
  status: OnboardingTaskStatus;
  dueDate?: string;
  assignedTo?: string;
  createdAt: string;
  completedAt?: string;
}

export interface WorkspaceData {
  version: number;
  jobs: JobRequirements[];
  candidates: Candidate[];
  activity: ActivityEntry[];
}
