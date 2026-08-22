import { describe, expect, it } from "vitest";
import { computeMatch } from "@/lib/scoring/engine";
import { parseResume } from "@/lib/parsing/resume-parser";
import type { JobRequirements } from "@/lib/types";

const RESUME_TEXT = `Dana Wolfe
dana.wolfe@example.com

Skills
React, TypeScript, Next.js, Tailwind CSS, GraphQL, Jest

Work Experience
Frontend Engineer at WebCo
Jan 2021 - Present
- Built React dashboards
Developer at SmallShop
Feb 2019 - Dec 2020
- JavaScript features

Education
B.S. in Computer Science from State University - 2019`;

function makeJob(overrides: Partial<JobRequirements> = {}): JobRequirements {
  return {
    id: "test-job",
    title: "Frontend Engineer",
    requiredSkills: [{ name: "React" }, { name: "TypeScript" }],
    preferredSkills: [{ name: "GraphQL" }, { name: "Next.js" }],
    minYearsExperience: 3,
    educationRequirement: { level: "bachelor", field: "Computer Science" },
    certificationRequirements: [],
    keywords: ["dashboard", "accessibility"],
    domains: [],
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

describe("computeMatch", () => {
  const resume = parseResume(RESUME_TEXT);

  it("produces scores within 0-100 and weights summing to 100", () => {
    const match = computeMatch(resume, makeJob(), RESUME_TEXT);
    expect(match.overallScore).toBeGreaterThanOrEqual(0);
    expect(match.overallScore).toBeLessThanOrEqual(100);
    const weightSum = match.factors.reduce((s, f) => s + f.weight, 0);
    expect(weightSum).toBe(100);
  });

  it("detects matched vs missing required skills", () => {
    const match = computeMatch(resume, makeJob(), RESUME_TEXT);
    expect(match.matchedSkills).toContain("React");
    expect(match.matchedSkills).toContain("TypeScript");
    expect(match.missingSkills).toHaveLength(0);
  });

  it("flags missing skills when the candidate lacks them", () => {
    const job = makeJob({
      requiredSkills: [{ name: "React" }, { name: "Rust" }, { name: "Kubernetes" }],
    });
    const match = computeMatch(resume, job, RESUME_TEXT);
    expect(match.missingSkills).toContain("Rust");
    expect(match.missingSkills).toContain("Kubernetes");
    // Score must drop versus full coverage.
    const full = computeMatch(resume, makeJob(), RESUME_TEXT);
    expect(match.overallScore).toBeLessThan(full.overallScore);
  });

  it("rewards exceeding the experience bar and penalizes falling short", () => {
    const highBar = computeMatch(
      resume,
      makeJob({ minYearsExperience: 15 }),
      RESUME_TEXT,
    );
    const lowBar = computeMatch(resume, makeJob({ minYearsExperience: 1 }), RESUME_TEXT);
    expect(lowBar.overallScore).toBeGreaterThan(highBar.overallScore);
    expect(highBar.experienceComparison.verdict).toBe("below");
    expect(lowBar.experienceComparison.verdict === "meets" || lowBar.experienceComparison.verdict === "exceeds").toBe(true);
  });

  it("is deterministic — identical inputs produce identical scores", () => {
    const a = computeMatch(resume, makeJob(), RESUME_TEXT);
    const b = computeMatch(resume, makeJob(), RESUME_TEXT);
    expect(a.overallScore).toBe(b.overallScore);
    expect(a.factors).toEqual(b.factors);
  });

  it("extracts evidence quotes from the resume text", () => {
    const match = computeMatch(resume, makeJob(), RESUME_TEXT);
    expect(match.evidence.some((e) => e.term === "React")).toBe(true);
    expect(match.evidence[0].quote.length).toBeGreaterThan(0);
  });

  it("handles jobs with no requirements without crashing", () => {
    const emptyJob = makeJob({
      requiredSkills: [],
      preferredSkills: [],
      minYearsExperience: undefined,
      educationRequirement: undefined,
      certificationRequirements: [],
      keywords: [],
    });
    const match = computeMatch(resume, emptyJob, RESUME_TEXT);
    expect(match.overallScore).toBeGreaterThan(0);
    expect(Number.isFinite(match.overallScore)).toBe(true);
  });

  it("ranks stronger candidates higher for ranking tables", () => {
    const strongText = RESUME_TEXT.replace(
      "Junior enthusiasm",
      "Senior expertise",
    ) + "\nCertifications\nAWS Certified Solutions Architect - 2022";
    const strongResume = parseResume(strongText);
    const weakResume = parseResume(MINIMAL_WEAK);
    const job = makeJob();
    const strong = computeMatch(strongResume, job, strongText).overallScore;
    const weak = computeMatch(weakResume, job, MINIMAL_WEAK).overallScore;
    expect(strong).toBeGreaterThanOrEqual(weak);
  });
});

const MINIMAL_WEAK = `Sam Lee
sam.lee@example.com
Some experience with sales and customer support.
High school diploma.`;
