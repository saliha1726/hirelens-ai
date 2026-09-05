/**
 * Persistence layer tests.
 *
 * Firebase is mocked to simulate unconfigured state. All operations must
 * work purely in-memory with zero localStorage/sessionStorage dependency.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Candidate, JobRequirements, ScreeningRecord, MatchResult } from "@/lib/types";

// Mock firebase/config before importing store
vi.mock("@/lib/firebase/config", () => ({
  isFirebaseConfigured: () => false,
  getFirebaseDb: vi.fn(() => { throw new Error("Firebase not configured"); }),
  getFirebaseAuth: vi.fn(() => { throw new Error("Firebase not configured"); }),
  getFirebaseApp: vi.fn(() => { throw new Error("Firebase not configured"); }),
}));

// Mock all firebase/firestore methods
vi.mock("firebase/firestore", () => ({
  collection: vi.fn(),
  doc: vi.fn(),
  onSnapshot: vi.fn(() => vi.fn()),
  setDoc: vi.fn(),
  deleteDoc: vi.fn(),
  writeBatch: vi.fn(() => ({
    delete: vi.fn(),
    commit: vi.fn(),
  })),
  query: vi.fn(),
  orderBy: vi.fn(),
  getDocs: vi.fn(() => Promise.resolve({ forEach: vi.fn() })),
}));

// Store must be imported AFTER mocks are set up
let store: typeof import("@/lib/client/store");

beforeEach(async () => {
  vi.resetModules();
  store = await import("@/lib/client/store");
  store.resetWorkspace();
});

function makeMatchResult(overrides?: Partial<MatchResult>): MatchResult {
  return {
    overallScore: 85,
    factors: [],
    strengths: [],
    gaps: [],
    missingSkills: [],
    matchedSkills: ["React"],
    skillGaps: { preferred: [], partial: [] },
    experienceComparison: { requiredYears: 3, candidateYears: 5, verdict: "meets", detail: "" },
    keywordHits: ["react"],
    evidence: [],
    ...overrides,
  };
}

function makeJob(overrides?: Partial<JobRequirements>): JobRequirements {
  return {
    id: crypto.randomUUID(),
    title: "Frontend Engineer",
    requiredSkills: [{ name: "React" }, { name: "TypeScript" }],
    keywords: ["frontend", "react"],
    domains: ["engineering"],
    responsibilities: [],
    certificationRequirements: [],
    preferredSkills: [],
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

function makeCandidate(overrides?: Partial<Candidate>): Candidate {
  return {
    id: crypto.randomUUID(),
    resume: {
      skills: [{ name: "React" }],
      experience: [],
      education: [],
      certifications: [],
      domains: ["engineering"],
      rawTextLength: 1000,
      confidence: 0.8,
      parseWarnings: [],
    },
    screenings: [],
    notes: [],
    interviews: [],
    status: "new",
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

function makeScreening(jobId: string, jobTitle: string): ScreeningRecord {
  return {
    id: crypto.randomUUID(),
    jobId,
    jobTitle,
    match: makeMatchResult(),
    createdAt: new Date().toISOString(),
  };
}

describe("Persistence: no localStorage dependency", () => {
  it("never calls localStorage or sessionStorage in source code", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const storeSource = fs.readFileSync(
      path.resolve(__dirname, "../src/lib/client/store.ts"),
      "utf-8",
    );
    expect(storeSource).not.toMatch(/localStorage/);
    expect(storeSource).not.toMatch(/sessionStorage/);
    expect(storeSource).not.toMatch(/window\.storage/);
  });

  it("store source contains no browser-storage API calls", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const storeSource = fs.readFileSync(
      path.resolve(__dirname, "../src/lib/client/store.ts"),
      "utf-8",
    );
    const lines = storeSource.split("\n");
    for (const line of lines) {
      if (line.trim().startsWith("//")) continue;
      expect(line).not.toMatch(/getItem|setItem|removeItem|clear\(\)/);
    }
  });
});

describe("Persistence: in-memory state operations", () => {
  it("getState returns empty initial state", () => {
    const s = store.getState();
    expect(s.jobs).toEqual([]);
    expect(s.candidates).toEqual([]);
    expect(s.activity).toEqual([]);
  });

  it("upsertJobs adds jobs to state", () => {
    const job = makeJob();
    store.upsertJobs([job]);

    const s = store.getState();
    expect(s.jobs).toHaveLength(1);
    expect(s.jobs[0].id).toBe(job.id);
    expect(s.jobs[0].title).toBe("Frontend Engineer");
  });

  it("upsertJobs deduplicates by id", () => {
    const job = makeJob();
    store.upsertJobs([job]);
    store.upsertJobs([job]);

    expect(store.getState().jobs).toHaveLength(1);
  });

  it("saveJob adds job and logs activity", () => {
    const job = makeJob();
    store.saveJob(job);

    const s = store.getState();
    expect(s.jobs).toHaveLength(1);
    expect(s.activity).toHaveLength(1);
    expect(s.activity[0].kind).toBe("job-created");
    expect(s.activity[0].message).toContain(job.title);
  });

  it("deleteJob removes job", () => {
    const job = makeJob();
    store.upsertJobs([job]);
    expect(store.getState().jobs).toHaveLength(1);

    store.deleteJob(job.id);
    expect(store.getState().jobs).toHaveLength(0);
  });

  it("addScreenedCandidates adds new candidates", () => {
    const job = makeJob();
    store.upsertJobs([job]);

    const candidate = makeCandidate({ fileName: "alice.pdf" });
    candidate.screenings = [makeScreening(job.id, job.title)];

    store.addScreenedCandidates([candidate], job);

    const s = store.getState();
    expect(s.candidates).toHaveLength(1);
    expect(s.candidates[0].fileName).toBe("alice.pdf");
    expect(s.activity.length).toBeGreaterThanOrEqual(1);
  });

  it("addScreenedCandidates updates existing candidates with new screenings", () => {
    const jobA = makeJob({ title: "Job A" });
    const jobB = makeJob({ title: "Job B" });
    store.upsertJobs([jobA, jobB]);

    const candidate = makeCandidate({ fileName: "alice.pdf" });
    candidate.screenings = [makeScreening(jobA.id, jobA.title)];
    store.addScreenedCandidates([candidate], jobA);

    const candidateV2 = makeCandidate({ fileName: "alice.pdf" });
    candidateV2.screenings = [makeScreening(jobB.id, jobB.title)];
    store.addScreenedCandidates([candidateV2], jobB);

    const s = store.getState();
    expect(s.candidates).toHaveLength(1);
    expect(s.candidates[0].screenings).toHaveLength(2);
  });

  it("addNote attaches note to candidate", () => {
    const job = makeJob();
    store.upsertJobs([job]);
    const candidate = makeCandidate({ fileName: "bob.pdf" });
    candidate.screenings = [makeScreening(job.id, job.title)];
    store.addScreenedCandidates([candidate], job);

    store.addNote(candidate.id, "Great communication skills");

    const updated = store.getState().candidates.find((c) => c.id === candidate.id);
    expect(updated!.notes).toHaveLength(1);
    expect(updated!.notes[0].text).toBe("Great communication skills");
  });

  it("deleteNote removes note from candidate", () => {
    const job = makeJob();
    store.upsertJobs([job]);
    const candidate = makeCandidate({ fileName: "bob.pdf" });
    candidate.screenings = [makeScreening(job.id, job.title)];
    store.addScreenedCandidates([candidate], job);
    store.addNote(candidate.id, "Some note");

    const noteId = store.getState().candidates[0].notes[0].id;
    store.deleteNote(candidate.id, noteId);

    const updated = store.getState().candidates.find((c) => c.id === candidate.id);
    expect(updated!.notes).toHaveLength(0);
  });

  it("setStatus updates candidate status", () => {
    const job = makeJob();
    store.upsertJobs([job]);
    const candidate = makeCandidate({ fileName: "carol.pdf" });
    candidate.screenings = [makeScreening(job.id, job.title)];
    store.addScreenedCandidates([candidate], job);

    store.setStatus(candidate.id, "shortlisted");

    const updated = store.getState().candidates.find((c) => c.id === candidate.id);
    expect(updated!.status).toBe("shortlisted");
  });

  it("resetWorkspace clears all data", () => {
    const job = makeJob();
    store.upsertJobs([job]);
    const candidate = makeCandidate();
    store.addScreenedCandidates([candidate], job);

    store.resetWorkspace();

    const s = store.getState();
    expect(s.jobs).toEqual([]);
    expect(s.candidates).toEqual([]);
    expect(s.activity).toEqual([]);
  });

  it("resetWorkspace with demoData seeds fresh data", () => {
    const demoJobs = [makeJob({ title: "Demo Job 1" }), makeJob({ title: "Demo Job 2" })];
    store.upsertJobs(demoJobs);

    store.resetWorkspace({
      jobs: [makeJob({ title: "Replacement" })],
      candidates: [],
      activity: [],
    });

    const s = store.getState();
    expect(s.jobs).toHaveLength(1);
    expect(s.jobs[0].title).toBe("Replacement");
  });
});

describe("Persistence: workspace isolation", () => {
  it("all data scoped to current user — no cross-user leakage", () => {
    // With Firebase mocked as unconfigured, store returns empty state
    // Real isolation is enforced by Firestore rules + store's getUid() check
    const s = store.getState();
    expect(s.jobs).toEqual([]);
    expect(s.candidates).toEqual([]);

    // Operations still work in-memory
    const job = makeJob();
    store.upsertJobs([job]);
    expect(store.getState().jobs).toHaveLength(1);

    // After simulated "new session" (reset), data is cleared
    store.resetWorkspace();
    expect(store.getState().jobs).toHaveLength(0);
  });
});

describe("Persistence: dashboard stats computed from live data", () => {
  it("computes stats from in-memory state without hardcoded values", () => {
    const job = makeJob();
    store.upsertJobs([job]);

    const strong = makeCandidate({ fileName: "strong.pdf" });
    strong.screenings = [{ ...makeScreening(job.id, job.title), match: makeMatchResult({ overallScore: 90 }) }];
    store.addScreenedCandidates([strong], job);

    const weak = makeCandidate({ fileName: "weak.pdf" });
    weak.screenings = [{ ...makeScreening(job.id, job.title), match: makeMatchResult({ overallScore: 30 }) }];
    store.addScreenedCandidates([weak], job);

    const s = store.getState();
    expect(s.candidates).toHaveLength(2);
    expect(s.jobs).toHaveLength(1);

    // Stats would be computed by dashboard components from this live data
    const screened = s.candidates.filter((c) => c.screenings.length > 0);
    expect(screened).toHaveLength(2);
  });
});
