import { describe, expect, it } from "vitest";
import { parseJobDescription } from "@/lib/parsing/jd-parser";

const JD = `Staff Data Engineer at Acme Robotics

We build warehouse automation. Join our data platform team.

Responsibilities
- Design ETL pipelines for sensor telemetry
- Own the Snowflake warehouse

Requirements
- 6+ years of professional experience
- Expert Python and Apache Spark skills required
- Strong SQL and Airflow experience
- Master's degree in Computer Science or related field
- AWS Certified Solutions Architect certification preferred

Nice to have
- Kafka streaming experience
- Kubernetes knowledge is a plus
- dbt modeling exposure`;

describe("parseJobDescription", () => {
  const job = parseJobDescription(JD);

  it("extracts the job title", () => {
    expect(job.title).toContain("Data Engineer");
  });

  it("extracts minimum years of experience", () => {
    expect(job.minYearsExperience).toBe(6);
  });

  it("splits required vs preferred skills", () => {
    const req = job.requiredSkills.map((s) => s.name);
    const pref = job.preferredSkills.map((s) => s.name);
    expect(req).toContain("Python");
    expect(req).toContain("SQL");
    expect(pref).toContain("Kafka");
    expect(pref).toContain("dbt");
  });

  it("extracts education requirements with field", () => {
    expect(job.educationRequirement?.level).toBe("master");
    expect(job.educationRequirement?.field?.toLowerCase()).toContain("computer science");
  });

  it("extracts certification requirements", () => {
    expect(job.certificationRequirements.join(", ")).toContain("AWS Certified");
  });

  it("extracts keywords and domains", () => {
    expect(job.keywords.length).toBeGreaterThan(3);
    expect(job.domains).toBeDefined();
  });

  it("handles a JD with no structure gracefully", () => {
    const flat = parseJobDescription(
      "Growth Marketer role. We need someone with SEO, content marketing and Google Analytics experience. 3 years experience.",
    );
    expect(flat.title.toLowerCase()).toContain("growth marketer");
    expect(flat.minYearsExperience).toBe(3);
    const names = flat.requiredSkills.map((s) => s.name);
    expect(names).toContain("SEO");
  });
});
