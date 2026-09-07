# HireLens AI

**AI-powered resume screening, matching & hiring intelligence.**

HireLens AI is a decision-support assistant for recruiters: upload resumes against a job description and get deterministic, explainable compatibility scores — enriched with AI-generated qualitative insights. **The recruiter always makes the final decision; HireLens never does.**

> 🟢 **Live:** [https://hirelens-ai-black.vercel.app](https://hirelens-ai-black.vercel.app)

---

## What it does

- **Screen resumes at scale** — upload up to 10 PDF/DOCX/TXT resumes per run against any job description
- **Explainable matching** — every score decomposes into weighted factors (required skills 40%, relevant experience 18%, years of experience 12%, preferred skills 10%, education 8%, certifications 6%, keywords 6%), with per-job custom weights
- **Structured resume parsing** — contact info, skills, experience timeline, education, certifications, seniority & industry domains extracted deterministically
- **Job requirement extraction** — required vs. preferred skills, minimum years, education bar, certifications, seniority target and salient keywords from raw JD text
- **AI interpretation (MiMo)** — balanced summaries, strengths, concerns and interview focus areas. The AI **never changes scores**; it only interprets the already-computed result
- **ML second opinion (Python + Scikit-learn + TensorFlow)** — a Flask microservice (`ml-service/`) scores every resume with TF-IDF + cosine similarity, a RandomForest match-band classifier, **and a TensorFlow Keras neural network** — all three shown together with agreement indicators. Every screening can be logged to **MongoDB Atlas** (set `MONGO_URI`). Runs independently and never blocks screening when offline
- **Cloud sync (Firestore)** — every job, candidate, note, interview, offer and onboarding task persists to Firestore with real-time listeners; works across devices and tabs
- **Team workspaces** — invite members by email (admin/recruiter/viewer roles), role-gated UI, workspace switcher
- **Public job board + apply links** — share a public board (`/jobs-board?ws=…`), let candidates apply online (`/apply/{ws}/{job}`) with automatic resume parsing & scoring; admins get email notifications on each application
- **Hiring pipeline** — Kanban drag-and-drop across 6 stages, interview scheduling, scorecards, offer tracking, onboarding checklists
- **Analytics** — score distributions, funnel conversion rates, skill-gap analysis, per-job performance, CSV/PDF exports
- **Hiring-safety by design** — protected characteristics are excluded from scoring inputs and explicitly ignored by the AI layer; resume content is treated as untrusted data, never as instructions

## Tech stack

| Layer | Choice |
|---|---|
| Framework | Next.js 15 (App Router) + React 19 + TypeScript |
| Styling | Tailwind CSS v3, dark/light theme (`next-themes`) |
| Animation | Framer Motion |
| Auth & DB | Firebase Auth (email + Google) · Firestore |
| AI | MiMo (OpenAI-compatible REST API, server-side only) |
| **ML microservice** | **Python 3 + Flask + Scikit-learn (TF-IDF, cosine similarity, RandomForest) + TensorFlow (Keras neural network) + MongoDB logging** |
| Email | Nodemailer via Gmail SMTP (invites, application alerts) |
| Document parsing | `unpdf` (PDF), `mammoth` (DOCX) |
| Validation | Zod + custom file/magic-byte validation |
| Tests | Vitest (51 unit/integration tests) |

## Getting started

```bash
npm install
cp .env.example .env.local   # add Firebase + optional AI/email vars
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
| `NEXT_PUBLIC_FIREBASE_API_KEY` etc. | Yes | Firebase client config (API key, auth domain, project ID, storage bucket, sender ID, app ID) |
| `FIREBASE_PROJECT_ID` / `FIREBASE_CLIENT_EMAIL` / `FIREBASE_PRIVATE_KEY` | Yes (server APIs) | Firebase Admin SDK service account for public apply/jobs endpoints |
| `MIMO_API_KEY` | Optional* | Enables AI summaries/insights via the MiMo OpenAI-compatible API |
| `ML_SERVICE_URL` | Optional* | URL of the Python/Scikit-learn microservice (e.g. `http://127.0.0.1:5001`). Enables ML analysis in screening results |
| `MONGO_URI` | Optional (ML service) | MongoDB Atlas connection string — the microservice logs every screening to the `screenings` collection |
| `GMAIL_USER` / `GMAIL_APP_PASSWORD` | Optional* | Gmail SMTP for team invites & application notifications |
| `NEXT_PUBLIC_APP_URL` | No | Public URL used in email links |

\* *Without these the app is fully functional minus AI insights and email delivery — deterministic scoring runs identically and the UI clearly marks AI insights as unavailable.*

**Never commit `.env.local`.** All secrets stay server-side; no key is ever sent to the browser.

## Architecture (short version)

```
Browser ──multipart──▶ /api/screen (serverless)
                        ├─ validate files (type/size/magic bytes/rate limit)
                        ├─ extract text (unpdf / mammoth / utf-8)
                        ├─ parseResume() ──────┐
                        ├─ parseJobDescription() ─┤
                        ├─ computeMatch() ◀───────┘  deterministic, explainable
                        └─ generateCandidateInsight() → MiMo (interpretation ONLY)

Client store (lib/client/store.ts)
  ├─ Firestore per-workspace: workspaces/{wsId}/jobs|candidates|activity|offers|onboarding
  ├─ Real-time onSnapshot listeners → cross-tab/device sync
  └─ Public flow: /api/apply (Admin SDK) → candidate + activity + admin email alert

ML microservice (ml-service/ — Python, Flask, Scikit-learn, TensorFlow, MongoDB)
  ├─ TF-IDF vectorizer + cosine similarity → textual match score 0–100
  ├─ RandomForest classifier (200 trees) → match band + confidence
  ├─ TensorFlow Keras neural network (16-8-4, softmax) → third opinion
  ├─ Trained at startup on 6,000 synthetic resume↔JD pairs
  ├─ MongoDB Atlas logging of every screening (optional, MONGO_URI)
  └─ POST /api/score — called by /api/screen as an optional second opinion
```

**Run the ML microservice:**

```bash
cd ml-service
pip install -r requirements.txt
python app.py          # http://127.0.0.1:5001
python test_app.py     # 4 unit tests
```

Full details: [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) · Scoring methodology: [`docs/SCORING.md`](docs/SCORING.md) · Safety: [`docs/SECURITY.md`](docs/SECURITY.md)

## Responsible use

HireLens AI is **decision support, not decision automation**. Scores measure textual alignment between a resume and a job description — they are a triage aid, not a verdict. See [docs/SECURITY.md](docs/SECURITY.md) for the fairness/safety posture.
