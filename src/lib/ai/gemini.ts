/**
 * Server-side AI client for recruitment insights.
 *
 * Provider: Google Gemini (OpenAI-compatible endpoint) with optional MiMo fallback.
 * API key NEVER leaves the server.
 * Resume/JD content is passed as delimited, untrusted DATA.
 * Graceful degradation: callers handle failure; features clearly
 * report unavailability instead of breaking the product.
 */

const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-3.6-flash";
const GEMINI_KEY = process.env.GEMINI_API_KEY;
const MIMO_MODEL = process.env.MIMO_MODEL || "mimo";
const MIMO_KEY = process.env.MIMO_API_KEY;
const MIMO_FALLBACK_MODELS = (process.env.MIMO_FALLBACK_MODELS || "").split(",").filter(Boolean);
const TIMEOUT_MS = 30_000;
const MAX_RETRIES = 2;

export type AIProvider = "gemini" | "mimo";

export function isAIEnabled(): boolean {
  return Boolean(GEMINI_KEY || MIMO_KEY);
}

export function getAIProvider(): AIProvider | null {
  if (GEMINI_KEY) return "gemini";
  if (MIMO_KEY) return "mimo";
  return null;
}

/** Model candidates in priority order. */
function getModelChain(): Array<{ model: string; apiKey: string; baseUrl: string; jsonMode: boolean }> {
  const chain: Array<{ model: string; apiKey: string; baseUrl: string; jsonMode: boolean }> = [];
  if (GEMINI_KEY) {
    chain.push({
      model: GEMINI_MODEL,
      apiKey: GEMINI_KEY,
      baseUrl: "https://generativelanguage.googleapis.com/v1beta/openai",
      jsonMode: true,
    });
  }
  if (MIMO_KEY) {
    for (const m of [MIMO_MODEL, ...MIMO_FALLBACK_MODELS.filter((x) => x !== MIMO_MODEL)]) {
      chain.push({
        model: m,
        apiKey: MIMO_KEY,
        baseUrl: process.env.MIMO_BASE_URL || "https://api.mimo.ai/v1",
        jsonMode: true,
      });
    }
  }
  return chain;
}

export class AIError extends Error {
  status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.name = "AIError";
    this.status = status;
  }
}

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface MiMoResponse {
  choices?: Array<{
    message?: { content?: string };
    finish_reason?: string;
  }>;
  error?: { message?: string; code?: number };
}

async function callModel(
  target: { model: string; apiKey: string; baseUrl: string; jsonMode: boolean },
  messages: ChatMessage[],
): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(`${target.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${target.apiKey}`,
      },
      body: JSON.stringify({
        model: target.model,
        messages,
        temperature: 0.25,
        max_tokens: 2048,
        ...(target.jsonMode ? { response_format: { type: "json_object" } } : {}),
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      let detail = "";
      try {
        const errJson = (await res.json()) as MiMoResponse;
        detail = errJson.error?.message ?? "";
      } catch {
        /* non-JSON error body */
      }
      throw new AIError(
        `AI request failed (${res.status})${detail ? `: ${truncate(detail)}` : ""}`,
        res.status,
      );
    }

    const json = (await res.json()) as MiMoResponse;
    const text = json.choices?.[0]?.message?.content?.trim();

    if (!text) {
      const reason = json.choices?.[0]?.finish_reason;
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
  const chain = getModelChain();
  if (chain.length === 0) throw new AIError("AI API key is not configured");

  let lastError: unknown;

  const messages: ChatMessage[] = [
    { role: "system", content: params.systemInstruction },
    { role: "user", content: params.userContent },
  ];

  for (const target of chain) {
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        const raw = await callModel(target, messages);
        return { data: extractJSON<T>(raw), modelUsed: target.model };
      } catch (err) {
        lastError = err;
        console.error(
          `generateStructured: model=${target.model} jsonMode=${target.jsonMode} attempt=${attempt} failed:`,
          err instanceof Error ? err.message : err,
        );
        const status = err instanceof AIError ? err.status : undefined;
        // Retry on rate limit / server errors AND on JSON-parse failures
        // (a non-JSON response often means the model ignored the format —
        // retrying without strict json_mode gives it another chance).
        const retryable =
          status === 429 ||
          (status != null && status >= 500) ||
          (err instanceof Error && err.message.includes("parse structured"));
        if (!retryable) break;
        await new Promise((r) => setTimeout(r, 800 * (attempt + 1)));
      }
    }
    // If all attempts failed with json_mode ON for this target, try once more
    // with json_mode OFF — some providers reject/choke on response_format.
    if (target.jsonMode) {
      try {
        const raw = await callModel({ ...target, jsonMode: false }, messages);
        return { data: extractJSON<T>(raw), modelUsed: target.model };
      } catch (err) {
        lastError = err;
        console.error(
          `generateStructured: fallback without json_mode failed:`,
          err instanceof Error ? err.message : err,
        );
      }
    }
  }

  if (lastError instanceof AIError) throw lastError;
  throw new AIError(lastError instanceof Error ? lastError.message : "Unknown AI error");
}
