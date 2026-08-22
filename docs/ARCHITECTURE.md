# Architecture

## Overview

HireLens AI is a single Next.js 15 (App Router) application deployed on Vercel. All sensitive work — document parsing, scoring, AI calls — happens server-side in Node.js runtime serverless functions. The browser never sees API keys, resume files of other users, or raw AI prompts.

```
┌───────────────────────────── Browser ─────────────────────────────┐
│  Landing · Dashboard · Screen · Candidates · Jobs · Compare       │
│  Workspace state → versioned localStorage (per-browser)           │
└──────────────┬────────────────────────────────────────────────────┘
               │ multipart/form-data or JSON (HTTPS)
┌──────────────▼──────────── Vercel Functions ──────────────────────┐
│ POST /api/screen                                                  │
│   1. rate limit (sliding window, per IP)                          │
│   2. validate: ≤10 files, ≤5 MB each, extension allowlist         │
│   3. magic-byte sniff (%PDF-, PK zip) — MIME types not trusted    │
│   4. extract text: unpdf / mammoth / UTF-8                        │
│   5. sanitize: control chars, zero-width chars, length cap        │
│   6. parseResume() + parseJobDescription()  ← deterministic       │
│   7. computeMatch()                         ← deterministic score │
│   8. generateCandidateInsight() → Gemini    ← interpretation only │
│ POST /api/parse-job · GET /api/health                             │
└──────────────┬────────────────────────────────────────────────────┘
               │ REST (server-side only, key in env)
      ┌────────▼────────┐
      │ Google Gemini   │  gemini-flash-latest (fallbacks configured)
      └─────────────────┘
```

## Directory map

| Path | Purpose |
|---|---|
| `src/lib/types.ts` | Domain model (resume, job, match, workspace) |
| `src/lib/skills/taxonomy.ts` | ~200 canonical skills with alias maps |
| `src/lib/scoring/engine.ts` | Deterministic weighted scoring (pure functions) |
| `src/lib/parsing/` | Document extraction + resume/JD parsers |
| `src/lib/ai/gemini.ts` | Server-only Gemini client (retries, fallback models, timeouts) |
| `src/lib/ai/insights.ts` | Injection-hardened insight generation |
| `src/lib/server/validation.ts` | File validation, zod schemas, rate limiter |
| `src/lib/client/store.ts` | localStorage workspace repository + `useWorkspace()` hook |
| `src/lib/sample-data.ts` | Demo data generated through the REAL pipeline |
| `src/app/(app)/` | Authenticated-style app shell pages |
| `src/app/api/` | The three API routes |

## Key design decisions

### 1. Deterministic core, AI at the edges
The score is computed by pure TypeScript (`computeMatch`) from structured facts. Gemini runs **after** scoring and can only produce prose. Consequences:
- Scores are reproducible and auditable (same inputs → same score).
- Prompt injection in a resume cannot change a number.
- The product degrades gracefully without an API key.

### 2. Client-side workspace (v1)
Candidate/job persistence is a versioned localStorage repository behind a small interface (`useWorkspace`, `importScreeningResult`, …). This keeps v1 deployable with zero database credentials while the UI code is already shaped for a server-backed swap: replace `lib/client/store.ts` internals with fetches to a CRUD API backed by Postgres/Upstash; no page components need to change. Multi-user/organizations would layer on top of that boundary.

### 3. Per-file error isolation
One corrupted upload never fails a batch — `/api/screen` returns per-file results with individual errors plus successful matches.

### 4. Bounded concurrency
Resume parsing runs with concurrency 4 and Gemini enrichment with bounded parallelism to stay inside serverless time/memory limits (`maxDuration = 60`).

### 5. Extensibility hooks
- `JobRequirements.id` is stable, so re-screening merges into existing candidates rather than duplicating them.
- `ParsedResume.confidence` + `parseWarnings` expose parser certainty to future UX.
- The storage schema is versioned (`version: 1`) enabling migrations.

## Testing strategy

Vitest covers the pure layers: taxonomy matching, resume/JD parsing, factor scoring, missing-skill detection, validation, rate limiting, sanitization, and a full demo-pipeline integration test that seeds through parse+score exactly like production. Run with `npm run test`; everything together with `npm run check`.
