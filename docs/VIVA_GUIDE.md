# HireLens AI — Viva Presentation Guide

Complete preparation material for your college viva: what to say, how to demo, and every likely question with its answer.

---

## 1. The One-Minute Pitch (memorize this)

> "HireLens AI is an AI-powered resume screening platform that helps recruiters shortlist candidates fairly and fast. Recruiters paste a job description and upload resumes. The system parses each resume, extracts skills, experience and education, and computes an **explainable match score** using a weighted 7-factor model. An AI layer adds qualitative insights, and a Python microservice with Scikit-learn and TensorFlow gives a machine-learning second opinion. Recruiters then manage candidates through a hiring pipeline — interviews, offers, onboarding — with team collaboration and role-based access. **Importantly, the AI never makes the hiring decision — it's decision support, not decision automation.**"

---

## 2. Problem Statement (why this project)

- Recruiters receive **hundreds of resumes per job posting**; manual screening takes days and is inconsistent
- Human screening is prone to bias and fatigue — different recruiters judge the same resume differently
- Existing ATS tools are expensive and score candidates as a "black box"

**Our solution:** fast, consistent, **explainable** scoring — every score shows exactly which factors contributed to it — with built-in fairness controls (protected characteristics are never scored).

---

## 3. Tech Stack (what & why)

| Layer | Technology | Why we chose it |
|---|---|---|
| Frontend | **React 19** + Next.js 15 + TypeScript | Component-based UI; Next.js gives routing, API routes, SSR/SEO; TypeScript prevents bugs via types |
| Styling | **Tailwind CSS** (utility-first CSS framework) | Same purpose as Bootstrap — responsive design — but allows full customization; industry standard |
| Backend | **Next.js API routes** (Node.js/TypeScript) | REST endpoints in one language as the frontend; shared types between client & server |
| ML Microservice | **Python 3 + Flask** | Required for ML libraries; runs as an independent service |
| ML Models | **Scikit-learn** (TF-IDF, cosine similarity, RandomForest) + **TensorFlow** (Keras neural network) | Classic IR techniques + ensemble ML + deep learning comparison |
| Database | **Firebase Firestore** (NoSQL document DB, same category as MongoDB) + **MongoDB** (ML logging) | Real-time sync across devices; serverless, free tier |
| Auth | **Firebase Authentication** | Email/password + Google login, secure session cookies |
| Live AI | **Google Gemini API** (gemini-3.6-flash) | Chat assistant, insights, JD analysis, email drafting |
| Email | **Nodemailer + Gmail SMTP** | Team invites, application alerts |
| Testing | **Vitest** (51 tests) + Python tests (6) | Unit/integration coverage of scoring, parsers, validation |
| Deployment | **Vercel + GitHub** (CI/CD) | Live app: https://hirelens-ai-black.vercel.app |
| Visualization | In-app analytics dashboard + **Power BI** (CSV export) | Funnel, distributions, skill gaps |

---

## 4. How the Scoring Works (the heart of the project)

**Deterministic rule-based engine** — the AI NEVER touches the numbers.

7 weighted factors (total = 100%):

| Factor | Weight | What it measures |
|---|---|---|
| Required skills | 40% | Does the resume contain each required skill? |
| Relevant experience | 18% | Are past job titles relevant to the role? |
| Years of experience | 12% | Meets minimum years? (over-qualified capped) |
| Preferred skills | 10% | Bonus skills present? |
| Education | 8% | Meets education level requirement? |
| Certifications | 6% | Required certs present? |
| Keywords | 6% | JD keywords present in resume? |

Example to say in viva:
> "A candidate matching all required skills gets 40/40 for that factor. Partial credit is given for multi-word skills. Recruiters can also customize the weights per job — e.g., make skills 60% for a technical role — and scores recompute."

**Why rule-based instead of ML for the score?** Explainability + fairness + consistency. Every score can be traced to visible factors. An ML model can't explain why it gave 73 vs 68, and can accidentally learn biases.

---

## 5. The Three AI/ML Layers (impressive to explain)

1. **Deterministic engine (TypeScript)** — computes the score. Explainable, tested, bias-controlled.
2. **Python ML microservice (Flask, port 5001)** — called by the main app as a *second opinion*:
   - **TF-IDF + cosine similarity** (Scikit-learn): converts JD and resume into numeric vectors, measures textual overlap → 0–100 score
   - **RandomForest classifier** (200 trees): trained on 6,000 synthetic resume–JD pairs, predicts match band (strong/good/possible/weak)
   - **TensorFlow Keras neural network** (16→8→4 softmax): third opinion; UI shows "✓ models agree" when RF and NN converge
   - Every request is logged to **MongoDB** (audit trail)
3. **Google Gemini LLM** — qualitative only:
   - Candidate insights (summary, strengths, concerns, interview focus)
   - Live chat assistant (knows your workspace data)
   - AI copilot (compare candidates, draft rejection/acceptance emails, interview plans)
   - JD Analyzer (quality score, improvements, inclusive-language check, salary range in INR)

**Safety design (say this — it's a strong point):** resume content is treated as *untrusted data* with prompt-injection defenses (instructions embedded in a resume are ignored), protected characteristics (race, religion, gender, age...) are explicitly excluded, and personal data is stripped before reaching the AI.

---

## 6. Architecture & Data Flow

```
Browser (React UI)
   │ multipart upload
   ▼
Next.js API /api/screen  ── rate limit, validate files (magic bytes), extract text (unpdf/mammoth)
   │                          │
   │ deterministic: parseResume + parseJD + computeMatch
   │                          │
   │ optional ML: HTTP → Flask microservice (TF-IDF + RF + TensorFlow + MongoDB log)
   │                          │
   │ optional LLM: Gemini → qualitative insight (never changes score)
   ▼
Ranked results → saved to Firestore (workspaces/{id}/jobs, candidates, activity)
   │ real-time onSnapshot listeners
   ▼
All devices/tabs stay in sync instantly
```

**Collections:** `workspaces/{wsId}/jobs | candidates | activity | offers | onboarding | members | invites` — per-workspace isolation, enforced by Firestore security rules + role-based access (admin/recruiter/viewer).

**Public flows:**
- `/jobs-board?ws=...` — public job board
- `/apply/{ws}/{job}` — candidates apply online; resume auto-parsed + scored; admins get email alert
- `/feedback/{ws}/{candidate}?token=...` — private feedback portal (tokenized, safe projection)

---

## 7. Security Features (professors love asking this)

1. **File validation** — extension + size + magic-byte sniffing (a renamed .exe can't pass as PDF)
2. **Rate limiting** — sliding window per IP on all public endpoints (8/min screening, 20/min chat)
3. **Session cookies** — httpOnly Firebase session, verified server-side
4. **Prompt-injection defense** — resume/JD content wrapped in untrusted-data tags with explicit ignore instructions
5. **PII stripping** — names/emails/phones removed before AI calls
6. **Fairness rules** — protected characteristics excluded by design, documented in docs/SECURITY.md
7. **Path-traversal sanitization** on filenames
8. **Role-based permissions** — viewers see read-only UI; Firestore rules enforce data-level access

---

## 8. Testing

- **51 TypeScript tests** (Vitest): scoring bounds & weights, JD parser, resume parser, validation, rate limiting, persistence
- **6 Python tests**: TF-IDF ranking, band classification, NN predictions, feature importance
- All passing; also `npm run lint`, `tsc --noEmit` clean

---

## 9. Live Demo Script (5 minutes)

1. **Login** → dashboard shows stats, upcoming interviews, needs-attention panel
2. **Screening** (`AI Screening`): paste a JD → upload 2-3 sample resumes → "Run screening" → show ranked cards, score ring, factor breakdown, evidence quotes
3. **Explain a score**: open the top candidate → "Here's exactly why 85%: 40% skills, 18% experience..."
4. **Pipeline**: drag a candidate from New → Shortlisted
5. **AI copilot**: on candidate page → "Interview plan" (show generated questions) → "AI compare" on compare page
6. **JD Analyzer**: sidebar → "Try a sample with problems" → Analyze → quality score, issues, INR salary range
7. **Chat assistant**: pink bubble → "Who are my top candidates?"
8. **ML microservice** (if running locally): show the cyan ML panel with 3 models + agreement
9. **Public apply**: copy apply link → open incognito → submit (admin gets email)
10. **Team page**: roles, invites

---

## 10. Likely Viva Questions & Answers

**Q: Why React over plain HTML/JS?**
A: Reusable components, state management for real-time data, conditional rendering, huge ecosystem. HTML/CSS still form the foundation — React generates them.

**Q: Why Tailwind instead of Bootstrap?**
A: Same category (CSS framework for responsive UI), but utility-first allows a fully custom design system instead of fixed components. It compiles to pure CSS — we still write CSS classes, just generated.

**Q: Why is the main database Firestore, not MySQL?**
A: Document-based NoSQL fits our nested candidate objects (resume → skills/experience/education) without complex joins. Real-time listeners sync across devices instantly — something MySQL can't do without websockets. MongoDB is used in the Python microservice for ML logging, so we demonstrate both SQL and NoSQL categories. (MongoDB is structurally identical to Firestore — collections of JSON documents.)

**Q: Is the AI making hiring decisions?**
A: No — deliberately. The score is computed by deterministic rules. AI only interprets results and drafts text. This is a fairness-by-design decision, documented in our security docs. A human always decides.

**Q: How does the match score avoid bias?**
A: Only job-relevant factors are scored (skills, experience, education, certs). Protected characteristics are excluded from inputs and explicitly ignored by the AI layer. We can't fully eliminate societal bias in resumes, but the system never adds to it.

**Q: What's TF-IDF?**
A: Term Frequency–Inverse Document Frequency — a numerical statistic showing how important a word is to a document. Rare terms (like "kubernetes") get high weight; common words ("experience") get low weight. We vectorize both JD and resume with TF-IDF and compute cosine similarity between them.

**Q: What does the RandomForest do?**
A: An ensemble of 200 decision trees, each trained on features like Jaccard similarity and skill-overlap ratios from 6,000 synthetic resume–JD pairs. Each tree votes; majority wins. It outputs a class (strong/good/possible/weak) with probabilities.

**Q: What's the neural network architecture?**
A: Keras Sequential — input 5 features → Dense(16, ReLU) → Dense(8, ReLU) → Dense(4, softmax). Trained 40 epochs with Adam optimizer on the same data. It serves as an independent third opinion; we show agreement between models.

**Q: How do you prevent malicious files?**
A: Extension whitelist, size caps, and magic-byte detection — the first bytes of the file must actually be a PDF/DOCX signature. Filenames are sanitized against path traversal.

**Q: How does real-time sync work?**
A: Firestore onSnapshot listeners — the client subscribes to collections; any change by any team member pushes updates to all open sessions instantly. No polling.

**Q: How is the app deployed?**
A: GitHub → Vercel CI/CD. Push triggers build + typecheck + deploy. Firebase hosts auth/database. The Python service runs separately (local or any Python host).

**Q: What are the limitations?**
A: Honest answers: (1) Resume parsing is heuristic — works best on standard formats; scanned image PDFs are rejected. (2) Salary ranges are AI estimates, not market data. (3) The ML model trains on synthetic data — real labeled hiring data would improve it. (4) Gemini free tier has rate limits.

**Q: Future scope?**
A: Resume search by semantic similarity (embeddings), structured interview scheduling with calendar invites, bias audit reports, mobile app, multi-language resumes.

---

## 11. Numbers to Remember

- 7 scoring factors, weights sum to 100
- 51 TypeScript tests + 6 Python tests
- 3 ML models (TF-IDF, RandomForest 200 trees, Keras NN 16→8→4)
- 6,000 synthetic training pairs
- 6 pipeline stages (new → screening → shortlisted → interview → hired/rejected)
- 3 roles (admin / recruiter / viewer)
- Up to 10 resumes per screening, 5MB each, 8 screenings/min rate limit
- 31 routes/pages in the app

---

## 12. Golden Rules for the Viva

1. **Lead with the problem**, not the tech — judges care about purpose
2. **Demo > slides** — have the app open in one tab, incognito in another
3. When asked "why X technology", always answer **problem-first**: "We needed real-time sync, so Firestore"
4. Never claim AI is unbiased — say "we minimize and control bias by design"
5. If asked something you don't know: "That's a great point — it's in our future scope along with..."
6. End with the safety story — decision support, not automation. It's your differentiator.
