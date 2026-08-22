import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import type { Candidate, JobRequirements, MatchResult, ParsedResume } from "@/lib/types";
import { computeMatch } from "@/lib/scoring/engine";
import { DocumentParseError, extractText, sanitizeFileName } from "@/lib/parsing/documents";
import { parseResume } from "@/lib/parsing/resume-parser";
import { parseJobDescription } from "@/lib/parsing/jd-parser";
import { generateCandidateInsight } from "@/lib/ai/insights";
import { isAIEnabled } from "@/lib/ai/gemini";
import {
  MAX_FILES_PER_REQUEST,
  clientKey,
  rateLimit,
  validateFileMeta,
} from "@/lib/server/validation";

export const runtime = "nodejs";
export const maxDuration = 60;

interface ResultEntry {
  fileName: string;
  resume?: ParsedResume;
  match?: MatchResult;
  aiInsight?: Awaited<ReturnType<typeof generateCandidateInsight>>;
  aiError?: string;
  error?: string;
}

/** Run async tasks with bounded concurrency to stay inside function limits. */
async function mapLimit<T, R>(
  items: T[],
  limit: number,
  fn: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let cursor = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (cursor < items.length) {
      const i = cursor++;
      out[i] = await fn(items[i], i);
    }
  });
  await Promise.all(workers);
  return out;
}

export async function POST(req: Request) {
  // ── Rate limiting ──────────────────────────────────────────────
  const rl = rateLimit(`screen:${clientKey(req)}`, 8, 60_000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many screening requests. Please wait a moment and try again." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSeconds) } },
    );
  }

  // ── Request shape ──────────────────────────────────────────────
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid multipart form data" }, { status: 400 });
  }

  const jdText = String(form.get("jdText") ?? "").trim();
  const jobJson = String(form.get("job") ?? "").trim();

  if (!jdText && !jobJson) {
    return NextResponse.json(
      { error: "Provide either a pasted job description (jdText) or a saved job (job)." },
      { status: 400 },
    );
  }
  if (jdText.length > 30_000) {
    return NextResponse.json(
      { error: "Job description exceeds the 30,000 character limit." },
      { status: 400 },
    );
  }

  const files = form.getAll("files").filter((f): f is File => f instanceof File);
  if (files.length === 0) {
    return NextResponse.json({ error: "No resume files uploaded." }, { status: 400 });
  }
  if (files.length > MAX_FILES_PER_REQUEST) {
    return NextResponse.json(
      { error: `Too many files. Maximum ${MAX_FILES_PER_REQUEST} resumes per screening run.` },
      { status: 400 },
    );
  }

  // ── Job requirements ───────────────────────────────────────────
  let job: JobRequirements;
  try {
    job = jobJson
      ? (JSON.parse(jobJson) as JobRequirements)
      : parseJobDescription(jdText);
  } catch {
    return NextResponse.json({ error: "Could not interpret the job description." }, { status: 400 });
  }
  if (!job.id) job.id = randomUUID();

  // ── Extract & score each resume (per-file isolation) ───────────
  const entries = await mapLimit(files, 4, async (file): Promise<ResultEntry> => {
    const fileName = sanitizeFileName(file.name);
    try {
      const metaCheck = validateFileMeta(fileName, file.size);
      if (!metaCheck.ok) return { fileName, error: metaCheck.reason };

      const bytes = new Uint8Array(await file.arrayBuffer());
      const text = await extractText(fileName, bytes);
      if (text.replace(/\s/g, "").length < 80) {
        return { fileName, error: "Could not extract enough readable text from this file." };
      }

      const resume = parseResume(text);
      const match = computeMatch(resume, job, text);

      // AI layer: qualitative interpretation only — cannot change the score.
      let aiInsight: ResultEntry["aiInsight"];
      let aiError: string | undefined;
      if (isAIEnabled()) {
        try {
          aiInsight = await generateCandidateInsight(resume, job, match);
        } catch (err) {
          aiError =
            err instanceof Error && err.name !== "AIError"
              ? "AI summary temporarily unavailable"
              : err instanceof Error
                ? `AI summary unavailable: ${err.message.slice(0, 140)}`
                : "AI summary unavailable";
        }
      }

      return { fileName, resume, match, aiInsight, aiError };
    } catch (err) {
      const reason =
        err instanceof DocumentParseError
          ? err.message
          : "Unexpected processing error for this file.";
      return { fileName, error: reason };
    }
  });

  const succeeded = entries.filter((e) => e.match);
  if (succeeded.length === 0) {
    const firstError = entries[0]?.error ?? "No resumes could be processed.";
    return NextResponse.json(
      { error: firstError, job, results: entries },
      { status: 422 },
    );
  }

  // Rank strongest first.
  entries.sort((a, b) => (b.match?.overallScore ?? -1) - (a.match?.overallScore ?? -1));

  return NextResponse.json({
    job,
    results: entries,
    ranked: true,
    aiEnabled: isAIEnabled(),
    processedAt: new Date().toISOString(),
  });
}
