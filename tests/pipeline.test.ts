import { describe, expect, it } from "vitest";
import { buildDemoWorkspace } from "@/lib/sample-data";

describe("demo pipeline integration", () => {
  const ws = buildDemoWorkspace();

  it("seeds jobs and candidates through the real pipeline", () => {
    expect(ws.jobs.length).toBe(3);
    expect(ws.candidates.length).toBeGreaterThanOrEqual(8);
    for (const c of ws.candidates) {
      expect(c.screenings.length).toBe(3);
      expect(c.resume.skills.length).toBeGreaterThan(0);
      expect(c.fileName).toBeTruthy();
    }
  });

  it("produces sane scores for every screening", () => {
    for (const c of ws.candidates) {
      for (const s of c.screenings) {
        expect(s.match.overallScore).toBeGreaterThan(0);
        expect(s.match.overallScore).toBeLessThanOrEqual(100);
        expect(s.match.factors).toHaveLength(7);
      }
    }
  });

  it("ranks the experienced frontend candidate above the junior intern for the frontend role", () => {
    const frontendJob = ws.jobs.find((j) => j.title === "Senior Frontend Engineer")!;
    const byId = (name: string) => ws.candidates.find((c) => c.fileName?.startsWith(name))!;
    const senior = byId("amara");
    const junior = byId("lena");
    const sScore = senior.screenings.find((s) => s.jobId === frontendJob.id)!.match.overallScore;
    const jScore = junior.screenings.find((s) => s.jobId === frontendJob.id)!.match.overallScore;
    expect(sScore).toBeGreaterThan(jScore + 15);
  });

  it("detects missing skills for mismatched candidates", () => {
    const dsJob = ws.jobs.find((j) => j.title === "Data Scientist")!;
    const devopsCandidate = ws.candidates.find((c) => c.fileName?.startsWith("tom"))!;
    const screening = devopsCandidate.screenings.find((s) => s.jobId === dsJob.id)!;
    expect(screening.match.missingSkills.length).toBeGreaterThan(0);
  });
});
