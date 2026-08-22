/**
 * Server-side validation for API boundaries.
 * Uploaded files and form fields are untrusted input — everything is
 * validated before parsing, with strict limits.
 */
import { z } from "zod";

export const MAX_FILES_PER_REQUEST = 10;
export const MAX_FILE_BYTES = 5 * 1024 * 1024; // 5 MB per file
export const MAX_JD_CHARS = 30_000;

export const ALLOWED_EXTENSIONS = ["pdf", "docx", "txt", "md"] as const;

export function validateFileMeta(name: string, size: number): { ok: true } | { ok: false; reason: string } {
  if (!name || name.length > 255) return { ok: false, reason: "Invalid file name" };
  const ext = name.toLowerCase().split(".").pop() ?? "";
  if (!(ALLOWED_EXTENSIONS as readonly string[]).includes(ext)) {
    return {
      ok: false,
      reason: `Unsupported file type ".${ext}". Allowed: ${ALLOWED_EXTENSIONS.map((e) => `.${e}`).join(", ")}`,
    };
  }
  if (size === 0) return { ok: false, reason: "File is empty" };
  if (size > MAX_FILE_BYTES) {
    return { ok: false, reason: `File exceeds the ${(MAX_FILE_BYTES / 1024 / 1024).toFixed(0)} MB limit` };
  }
  return { ok: true };
}

export const jdTextSchema = z
  .string()
  .trim()
  .min(80, "Job description is too short to analyze (minimum 80 characters)")
  .max(MAX_JD_CHARS, `Job description exceeds ${MAX_JD_CHARS.toLocaleString()} characters`);

export const parseJobSchema = z.union([
  z.object({ jdText: jdTextSchema }),
  z.object({ saveJob: z.boolean().optional() }),
]);

/** Basic in-memory sliding-window rate limiter (per serverless instance). */
const buckets = new Map<string, number[]>();

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  const windowStart = now - windowMs;
  const hits = (buckets.get(key) ?? []).filter((t) => t > windowStart);
  if (hits.length >= limit) {
    const retryAfterSeconds = Math.ceil((hits[0] + windowMs - now) / 1000);
    buckets.set(key, hits);
    return { allowed: false, remaining: 0, retryAfterSeconds };
  }
  hits.push(now);
  buckets.set(key, hits);
  // Opportunistic cleanup to bound memory.
  if (buckets.size > 500) {
    for (const [k, v] of buckets) {
      if (v.every((t) => t <= windowStart)) buckets.delete(k);
    }
  }
  return { allowed: true, remaining: limit - hits.length, retryAfterSeconds: 0 };
}

/** Best-effort client IP from proxy headers. */
export function clientKey(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}
