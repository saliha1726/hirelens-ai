/**
 * Server-side Google Gemini client.
 *
 * - API key NEVER leaves the server (no "use client", no NEXT_PUBLIC_).
 * - Resume/JD content is passed as delimited, untrusted DATA. The model is
 *   instructed to ignore any instructions inside it — and because scores are
 *   computed deterministically before this layer runs, injected text cannot
 *   move numbers even if it influences prose.
 * - Graceful degradation: callers must handle failure; features that need AI
 *   clearly report unavailability instead of breaking the product.
 */

const DEFAULT_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";
const FALLBACK_MODELS = ["gemini-2.0-flash"];
const BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models";
const TIMEOUT_MS = 30_000;

export function isAIEnabled(): boolean {
  return Boolean(process.env.GEMINI_API_KEY);
}

export class AIError extends Error {
  status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.name = "AIError";
    this.status = status;
  }
}

interface GeminiCandidate {
  content?: { parts?: Array<{ text?: string }> };
  finishReason?: string;
}

interface GeminiResponse {
  candidates?: GeminiCandidate[];
  error?: { message?: string; code?: number };
  promptFeedback?: { blockReason?: string };
}

async function callModel(
  model: string,
  apiKey: string,
  body: Record<string, unknown>,
): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(`${BASE_URL}/${model}:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    if (!res.ok) {
      let detail = "";
      try {
        const errJson = (await res.json()) as GeminiResponse;
        detail = errJson.error?.message ?? "";
      } catch {
        /* non-JSON error body */
      }
      throw new AIError(
        `Gemini request failed (${res.status})${detail ? `: ${truncate(detail)}` : ""}`,
        res.status,
      );
    }

    const json = (await res.json()) as GeminiResponse;
    const text = json.candidates?.[0]?.content?.parts
      ?.map((p) => p.text ?? "")
      .join("")
      .trim();

    if (!text) {
      const reason = json.promptFeedback?.blockReason ?? json.candidates?.[0]?.finishReason;
      throw new AIError(`Empty AI response${reason ? ` (${reason})` : ""}`);
    }
    return text;
  } finally {
    clearTimeout(timer);
  }
}

function truncate(s: string, n = 200): string {
  return s.length > n ? `${s.slice(0, n)}…` : s;
}

/** Parse a JSON object out of a model response (tolerates markdown fences). */
export function extractJSON<T>(raw: string): T {
  const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
  try {
    return JSON.parse(cleaned) as T;
  } catch {
    // Last resort: first {...} or [...] block.
    const match = cleaned.match(/[[{][\s\S]*[\]}]/);
    if (match) {
      try {
        return JSON.parse(match[0]) as T;
      } catch {
        /* fall through */
      }
    }
    throw new AIError("Could not parse structured output from model");
  }
}

export async function generateStructured<T>(params: {
  systemInstruction: string;
  userContent: string;
  temperature?: number;
  maxTokens?: number;
}): Promise<{ data: T; modelUsed: string }> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new AIError("GEMINI_API_KEY is not configured");

  const models = [DEFAULT_MODEL, ...FALLBACK_MODELS.filter((m) => m !== DEFAULT_MODEL)];
  let lastError: unknown;

  for (const model of models) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const raw = await callModel(model, apiKey, {
          systemInstruction: { parts: [{ text: params.systemInstruction }] },
          contents: [{ role: "user", parts: [{ text: params.userContent }] }],
          generationConfig: {
            temperature: params.temperature ?? 0.2,
            maxOutputTokens: params.maxTokens ?? 2048,
            responseMimeType: "application/json",
          },
        });
        return { data: extractJSON<T>(raw), modelUsed: model };
      } catch (err) {
        lastError = err;
        const status = err instanceof AIError ? err.status : undefined;
        // Retry once on rate-limit/server errors, then move to fallback model.
        if (!(status === 429 || (status != null && status >= 500))) break;
        await new Promise((r) => setTimeout(r, 800 * (attempt + 1)));
      }
    }
  }

  if (lastError instanceof AIError) throw lastError;
  throw new AIError(lastError instanceof Error ? lastError.message : "Unknown AI error");
}
