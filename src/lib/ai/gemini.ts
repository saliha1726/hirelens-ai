/**
 * Server-side AI client for recruitment insights.
 *
 * Provider: MiMo (OpenAI-compatible /chat/completions API).
 * API key NEVER leaves the server.
 * Resume/JD content is passed as delimited, untrusted DATA.
 * Graceful degradation: callers handle failure; features clearly
 * report unavailability instead of breaking the product.
 */

const DEFAULT_MODEL = process.env.MIMO_MODEL || "mimo";
const FALLBACK_MODELS = (process.env.MIMO_FALLBACK_MODELS || "").split(",").filter(Boolean);
const BASE_URL = process.env.MIMO_BASE_URL || "https://api.mimo.ai/v1";
const TIMEOUT_MS = 30_000;
const MAX_RETRIES = 2;

export type AIProvider = "mimo";

export function isAIEnabled(): boolean {
  return Boolean(process.env.MIMO_API_KEY);
}

export function getAIProvider(): AIProvider | null {
  return isAIEnabled() ? "mimo" : null;
}

function getApiKey(): string | undefined {
  return process.env.MIMO_API_KEY;
}

function getBaseUrl(): string {
  return process.env.MIMO_BASE_URL || "https://api.mimo.ai/v1";
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
  model: string,
  apiKey: string,
  messages: ChatMessage[],
): Promise<string> {
  const baseUrl = getBaseUrl();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.25,
        max_tokens: 2048,
        response_format: { type: "json_object" },
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
  const apiKey = getApiKey();
  if (!apiKey) throw new AIError("AI API key is not configured");

  const models = [DEFAULT_MODEL, ...FALLBACK_MODELS.filter((m) => m !== DEFAULT_MODEL)];
  let lastError: unknown;

  const messages: ChatMessage[] = [
    { role: "system", content: params.systemInstruction },
    { role: "user", content: params.userContent },
  ];

  for (const model of models) {
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        const raw = await callModel(model, apiKey, messages);
        return { data: extractJSON<T>(raw), modelUsed: model };
      } catch (err) {
        lastError = err;
        const status = err instanceof AIError ? err.status : undefined;
        if (!(status === 429 || (status != null && status >= 500))) break;
        await new Promise((r) => setTimeout(r, 800 * (attempt + 1)));
      }
    }
  }

  if (lastError instanceof AIError) throw lastError;
  throw new AIError(lastError instanceof Error ? lastError.message : "Unknown AI error");
}
