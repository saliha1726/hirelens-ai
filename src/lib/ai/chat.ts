/**
 * Conversational AI for the HireLens assistant chat.
 *
 * Uses Google Gemini (OpenAI-compatible endpoint) with optional MiMo fallback,
 * returning free-form text. The API key never leaves the server.
 */
import { AIError } from "@/lib/ai/gemini";

const TIMEOUT_MS = 30_000;
const MAX_RETRIES = 2;

interface Target {
  model: string;
  apiKey: string;
  baseUrl: string;
}

function getTargets(): Target[] {
  const targets: Target[] = [];
  if (process.env.GEMINI_API_KEY) {
    targets.push({
      model: process.env.GEMINI_MODEL || "gemini-3.6-flash",
      apiKey: process.env.GEMINI_API_KEY,
      baseUrl: "https://generativelanguage.googleapis.com/v1beta/openai",
    });
  }
  if (process.env.MIMO_API_KEY) {
    targets.push({
      model: process.env.MIMO_MODEL || "mimo",
      apiKey: process.env.MIMO_API_KEY,
      baseUrl: process.env.MIMO_BASE_URL || "https://api.mimo.ai/v1",
    });
  }
  return targets;
}

export function isChatEnabled(): boolean {
  return getTargets().length > 0;
}

export interface ChatTurn {
  role: "user" | "assistant";
  content: string;
}

export async function generateChatReply(params: {
  systemInstruction: string;
  history: ChatTurn[];
  message: string;
  temperature?: number;
}): Promise<string> {
  const targets = getTargets();
  if (targets.length === 0) throw new AIError("AI is not configured on this server");

  const messages = [
    { role: "system" as const, content: params.systemInstruction },
    ...params.history.slice(-10).map((t) => ({ role: t.role, content: t.content.slice(0, 4000) })),
    { role: "user" as const, content: params.message.slice(0, 6000) },
  ];

  let lastError: unknown;
  for (const target of targets) {
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
      try {
        const res = await fetch(`${target.baseUrl}/chat/completions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${target.apiKey}`,
          },
          body: JSON.stringify({
            model: target.model,
            messages,
            temperature: params.temperature ?? 0.5,
            max_tokens: 1200,
          }),
          signal: controller.signal,
        });

        if (!res.ok) {
          const status = res.status;
          if (status === 429 || status >= 500) {
            lastError = new AIError(`AI request failed (${status})`, status);
            await new Promise((r) => setTimeout(r, 800 * (attempt + 1)));
            continue;
          }
          throw new AIError(`AI request failed (${status})`);
        }

        const json = (await res.json()) as {
          choices?: Array<{ message?: { content?: string } }>;
        };
        const text = json.choices?.[0]?.message?.content?.trim();
        if (!text) throw new AIError("Empty AI response");
        return text;
      } catch (err) {
        lastError = err;
        if (err instanceof AIError && (err.status === 429 || (err.status != null && err.status >= 500))) {
          await new Promise((r) => setTimeout(r, 800 * (attempt + 1)));
          continue;
        }
        throw err;
      } finally {
        clearTimeout(timer);
      }
    }
  }

  throw lastError instanceof Error ? lastError : new AIError("AI request failed");
}
