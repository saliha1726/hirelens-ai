import { NextResponse } from "next/server";
import { isAIEnabled } from "@/lib/ai/gemini";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "hirelens-ai",
    version: "1.0.0",
    aiEnabled: isAIEnabled(),
    aiProvider: isAIEnabled() ? "google-gemini" : null,
    // Never expose the key or account identifiers here.
    timestamp: new Date().toISOString(),
  });
}
