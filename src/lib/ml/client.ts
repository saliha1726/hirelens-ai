/**
 * Client for the Python (Flask + Scikit-learn) ML microservice.
 *
 * The ML service is an OPTIONAL second opinion that runs alongside the
 * deterministic scoring engine. If the service is unreachable, screening
 * continues normally with deterministic scores only — ML adds, never replaces.
 */

const ML_SERVICE_URL = process.env.ML_SERVICE_URL ?? "http://127.0.0.1:5001";

export interface MLScoreTerm {
  term: string;
  jd_weight: number;
  resume_weight: number;
}

export interface MLScore {
  index: number;
  tfidf_similarity: number;
  score: number;
  top_terms: MLScoreTerm[];
  predicted_band: "strong" | "good" | "possible" | "weak";
  confidence: number;
  probabilities: Record<string, number>;
}

export interface MLResponse {
  ok: boolean;
  engine: string;
  results: MLScore[];
  feature_importance: Record<string, number>;
}

/** Is the ML microservice configured? (Env var present.) */
export function isMLEnabled(): boolean {
  return Boolean(process.env.ML_SERVICE_URL);
}

/** Is the ML microservice reachable? (Health check with short timeout.) */
export async function isMLReachable(): Promise<boolean> {
  if (!isMLEnabled()) return false;
  try {
    const res = await fetch(`${ML_SERVICE_URL}/api/health`, {
      signal: AbortSignal.timeout(1500),
      cache: "no-store",
    });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Score one JD against up to 10 resume texts with TF-IDF + RandomForest.
 * Returns null on any failure — callers must treat ML as optional.
 */
export async function scoreWithML(
  jdText: string,
  resumeTexts: string[],
): Promise<MLResponse | null> {
  if (!isMLEnabled() || resumeTexts.length === 0) return null;
  try {
    const res = await fetch(`${ML_SERVICE_URL}/api/score`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jd_text: jdText, resume_texts: resumeTexts }),
      signal: AbortSignal.timeout(20_000),
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = (await res.json()) as MLResponse;
    return data.ok ? data : null;
  } catch {
    return null;
  }
}
