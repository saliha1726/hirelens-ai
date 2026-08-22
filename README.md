# HireLens AI

**AI-powered resume screening, matching & hiring intelligence.**

HireLens AI is a decision-support assistant for recruiters: upload resumes against a job description and get deterministic, explainable compatibility scores — enriched with AI-generated qualitative insights. **The recruiter always makes the final decision; HireLens never does.**

> 🟢 **Live:** [https://hirelens-ai-black.vercel.app](https://hirelens-ai-black.vercel.app)

---

## What it does

- **Screen resumes at scale** — upload up to 10 PDF/DOCX/TXT resumes per run against any job description
- **Explainable matching** — every score decomposes into weighted factors (required skills 40%, relevant experience 18%, years of experience 12%, preferred skills 10%, education 8%, certifications 6%, keywords 6%)
- **Structured resume parsing** — contact info, skills, experience timeline, education, certifications, seniority & industry domains extracted deterministically
- **Job requirement extraction** — required vs. preferred skills, minimum years, education bar, certifications, seniority target and salient keywords from raw JD text
- **AI interpretation (Gemini)** — balanced summaries, strengths, concerns and interview focus areas. The AI **never changes scores**; it only interprets the already-computed result
- **Recruiter workspace** — candidate ranking table, search & filters, detail pages with evidence quotes, side-by-side comparison, notes, pipeline statuses, demo data seeding
- **Hiring-safety by design** — protected characteristics are excluded from scoring inputs and explicitly ignored by the AI layer; resume content is treated as untrusted data, never as instructions

## Tech stack

| Layer | Choice |
|---|---|
| Framework | Next.js 15 (App Router) + React 19 + TypeScript |
| Styling | Tailwind CSS v3, dark/light theme (`next-themes`) |
| Animation | Framer Motion |
| AI | Google Gemini REST API (`gemini-2.5-flash`, server-side only) |
| Document parsing | `unpdf` (PDF), `mammoth` (DOCX) |
| Validation | Zod + custom file/magic-byte validation |
| Tests | Vitest (35+ unit/integration tests) |

## Getting started

```bash
npm install
cp .env.example .env.local   # add your GEMINI_API_KEY (optional but recommended)
npm run dev                  # http://localhost:3000
```

Quality gates:

```bash
npm run typecheck   # tsc --noEmit
npm run lint        # eslint
npm run test        # vitest
npm run build       # production build
npm run check       # all of the above
```

## Environment variables

| Variable | Required | Description |
|---|---|---|
| `GEMINI_API_KEY` | Optional* | Google Gemini API key from [aistudio.google.com/apikey](https://aistudio.google.com/apikey). Enables AI summaries/insights. |
| `GEMINI_MODEL` | No | Override the model (default: `gemini-2.5-flash`, fallback: `gemini-2.0-flash`). |

\* *Without an API key the app is fully functional except AI-generated qualitative insights — deterministic scoring runs identically and the UI clearly marks AI insights as unavailable.*

**Never commit `.env.local`.** All secrets stay server-side; no key is ever sent to the browser.

## Architecture (short version)

```
Browser ──multipart──▶ /api/screen (serverless)
                        ├─ validate files (type/size/magic bytes/rate limit)
                        ├─ extract text (unpdf / mammoth / utf-8)
                        ├─ parseResume() ──────┐
                        ├─ parseJobDescription() ─┤
                        ├─ computeMatch() ◀───────┘  deterministic, explainable
                        └─ generateCandidateInsight() → Gemini (interpretation ONLY)
Client keeps a versioned localStorage workspace (jobs/candidates/notes/status)
— swappable for a database later via lib/client/store.ts.
```

Full details: [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) · Scoring methodology: [`docs/SCORING.md`](docs/SCORING.md) · Safety: [`docs/SECURITY.md`](docs/SECURITY.md)

## Responsible use

HireLens AI is **decision support, not decision automation**. Scores measure textual alignment between a resume and a job description — they are a triage aid, not a verdict. See [docs/SECURITY.md](docs/SECURITY.md) for the fairness/safety posture.

## License

MIT.
