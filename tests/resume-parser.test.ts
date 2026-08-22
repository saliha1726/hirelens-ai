import { describe, expect, it } from "vitest";
import { parseResume } from "@/lib/parsing/resume-parser";

const FULL_RESUME = `Sarah Chen
sarah.chen@example.com | +1 (312) 555-8899 | Chicago, IL

Professional Summary
Backend engineer with 6 years of experience in fintech.

Technical Skills
Python, Django, PostgreSQL, Redis, Docker, AWS, Kafka, Microservices

Work Experience

Senior Software Engineer at PayCore Fintech
Feb 2021 - Present
- Led payments microservices handling $50M monthly volume
- Improved API latency by 40%

Software Engineer at DataBank Systems
Mar 2018 - Jan 2021
- Built ETL pipelines in Python and SQL

Education
M.S. in Computer Science from University of Illinois - 2018
B.S. in Computer Science from Purdue University - 2016

Certifications
AWS Certified Solutions Architect - Associate - 2022
Certified Kubernetes Administrator - 2021`;

const MINIMAL_RESUME = `Alex Kim
alex.kim@example.com
Learning web development. Some experience with JavaScript.`;

describe("parseResume", () => {
  const parsed = parseResume(FULL_RESUME);

  it("extracts contact information", () => {
    expect(parsed.email).toBe("sarah.chen@example.com");
    expect(parsed.name).toBe("Sarah Chen");
    expect(parsed.phone).toBeTruthy();
    expect(parsed.location).toContain("Chicago");
  });

  it("extracts known skills via the taxonomy", () => {
    const names = parsed.skills.map((s) => s.name);
    for (const expected of ["Python", "Django", "PostgreSQL", "Redis", "Docker", "AWS", "Kafka"]) {
      expect(names).toContain(expected);
    }
  });

  it("parses dated work experience entries", () => {
    expect(parsed.experience.length).toBeGreaterThanOrEqual(2);
    const current = parsed.experience[0];
    expect(current.company).toContain("PayCore");
    expect(current.current).toBe(true);
    expect(parsed.totalYearsExperience).toBeGreaterThan(4);
  });

  it("parses education levels and institutions", () => {
    expect(parsed.education.length).toBeGreaterThanOrEqual(2);
    const levels = parsed.education.map((e) => e.level);
    expect(levels).toContain("master");
    expect(levels).toContain("bachelor");
    expect(parsed.education.some((e) => e.institution?.includes("Illinois"))).toBe(true);
  });

  it("detects certifications including year", () => {
    const names = parsed.certifications.map((c) => c.name).join(" | ");
    expect(names).toContain("AWS Certified Solutions Architect");
    expect(names).toContain("Kubernetes");
  });

  it("infers seniority from titles", () => {
    expect(parsed.seniority).toBe("senior");
  });

  it("flags low-confidence parses instead of failing", () => {
    const minimal = parseResume(MINIMAL_RESUME);
    expect(minimal.confidence).toBeLessThan(parsed.confidence);
    expect(minimal.parseWarnings.length).toBeGreaterThan(0);
    expect(minimal.email).toBe("alex.kim@example.com");
  });

  it("never throws on garbage input", () => {
    const garbage = parseResume("\n\n\x00\x01 random symbols !@#$%^&*() \n more noise \n");
    expect(garbage.skills).toBeDefined();
    expect(garbage.confidence).toBeGreaterThanOrEqual(0);
  });
});
