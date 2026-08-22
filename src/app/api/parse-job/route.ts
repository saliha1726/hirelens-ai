import { NextResponse } from "next/server";
import { parseJobDescription } from "@/lib/parsing/jd-parser";
import { isAIEnabled } from "@/lib/ai/gemini";
import { jdTextSchema, clientKey, rateLimit } from "@/lib/server/validation";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const rl = rateLimit(`parse-job:${clientKey(req)}`, 20, 60_000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please wait a moment." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSeconds) } },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = jdTextSchema.safeParse((body as { jdText?: unknown })?.jdText);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid job description" },
      { status: 400 },
    );
  }

  const job = parseJobDescription(parsed.data);

  return NextResponse.json({
    job,
    aiEnabled: isAIEnabled(),
    notes: [
      "Requirements extracted deterministically from the text.",
      ...(job.requiredSkills.length === 0
        ? ["No explicit skills were detected — consider adding a skills section to the description."]
        : []),
      ...(job.minYearsExperience == null
        ? ["No minimum years of experience was stated."]
        : []),
    ],
  });
}
