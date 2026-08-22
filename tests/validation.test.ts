import { describe, expect, it } from "vitest";
import { rateLimit, validateFileMeta, jdTextSchema } from "@/lib/server/validation";
import { cleanText } from "@/lib/parsing/text-clean";

describe("validateFileMeta", () => {
  it("accepts supported types within size limits", () => {
    expect(validateFileMeta("resume.pdf", 1024)).toEqual({ ok: true });
    expect(validateFileMeta("CV.DOCX", 1024)).toEqual({ ok: true });
    expect(validateFileMeta("notes.txt", 1024)).toEqual({ ok: true });
  });

  it("rejects unsupported extensions and dangerous names", () => {
    const exe = validateFileMeta("malware.exe", 1024);
    expect(exe.ok).toBe(false);
    if (!exe.ok) expect(exe.reason).toContain("Unsupported file type");
    expect(validateFileMeta("", 10).ok).toBe(false);
  });

  it("rejects empty and oversized files", () => {
    expect(validateFileMeta("a.pdf", 0).ok).toBe(false);
    expect(validateFileMeta("big.pdf", 6 * 1024 * 1024).ok).toBe(false);
  });
});

describe("rateLimit (sliding window)", () => {
  it("allows up to the limit then blocks with retry-after", () => {
    const key = `test-${Math.random()}`;
    for (let i = 0; i < 3; i++) {
      expect(rateLimit(key, 3, 60_000).allowed).toBe(true);
    }
    const blocked = rateLimit(key, 3, 60_000);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
  });

  it("keys are isolated per client", () => {
    const a = `a-${Math.random()}`;
    const b = `b-${Math.random()}`;
    rateLimit(a, 1, 60_000);
    expect(rateLimit(a, 1, 60_000).allowed).toBe(false);
    expect(rateLimit(b, 1, 60_000).allowed).toBe(true);
  });
});

describe("jdTextSchema", () => {
  it("rejects too-short and oversized job descriptions", () => {
    expect(jdTextSchema.safeParse("too short").success).toBe(false);
    expect(jdTextSchema.safeParse("x".repeat(31_000)).success).toBe(false);
    expect(
      jdTextSchema.safeParse(
        `${"A".repeat(200)} engineer with React experience required for this role`,
      ).success,
    ).toBe(true);
  });
});

describe("cleanText sanitization", () => {
  it("strips control characters and collapses whitespace", () => {
    const dirty = `hello\x07world\x08!\n\n\n\nSecond  line\ttabs`;
    const out = cleanText(dirty);
    // eslint-disable-next-line no-control-regex
    expect(out).not.toMatch(/[\x00-\x08]/);
    expect(out).toBe("hello world !\n\nSecond line tabs");
  });

  it("caps extreme lengths to protect serverless invocations", () => {
    const huge = "a".repeat(100_000);
    expect(cleanText(huge).length).toBeLessThanOrEqual(60_000);
  });
});
