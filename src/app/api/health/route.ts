import { NextResponse } from "next/server";
import { isAIEnabled, getAIProvider } from "@/lib/ai/gemini";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "hirelens-ai",
    version: "2.0.0",
    aiEnabled: isAIEnabled(),
    aiProvider: getAIProvider(),
    timestamp: new Date().toISOString(),
  });
}
