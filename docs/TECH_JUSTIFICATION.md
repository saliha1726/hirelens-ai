# HireLens AI — Technology Stack Justification

**Project:** HireLens AI — AI-Powered Resume Screening, Matching & Hiring Intelligence
**Live deployment:** https://hirelens-ai-black.vercel.app
**Source code:** https://github.com/saliha1726/hirelens-ai

---

## 1. Project Overview

HireLens AI is a full-stack, cloud-deployed recruitment decision-support system. Recruiters paste a job description, upload up to 10 resumes (PDF/DOCX/TXT), and receive **deterministic, explainable match scores** decomposed into seven weighted factors, along with AI-generated qualitative insights, a hiring pipeline (Kanban), interview scheduling, offer tracking, team collaboration with role-based permissions, and an interactive analytics dashboard. The system also includes a **public job board and online application portal** where candidates apply against a job, their resume is automatically parsed and scored, and workspace admins receive email alerts.

---

## 2. Mapping to the Recommended Tech Stack

| College Requirement | Implemented With | How the Requirement Is Met |
|---|---|---|
| **Frontend: React** | React 19 | The entire UI is a React application — 30+ reusable components, hooks, state management, conditional rendering, event handling. React is the core frontend library of the project. |
| **Frontend: HTML/CSS** | HTML5 + CSS (Tailwind CSS v3) | Every rendered page is HTML/CSS at its foundation. Tailwind CSS **is** CSS — a utility-first framework that generates pure CSS (custom design system, dark/light themes, responsive breakpoints, animations). |
| **Frontend: Bootstrap** | Tailwind CSS v3 | Bootstrap and Tailwind serve the identical purpose: a CSS framework for responsive, consistent UI. Tailwind was chosen because it is the current industry standard (used by Netflix, GitHub, Shopify) and allows full design customization instead of Bootstrap's fixed component styles. The learning outcome — *using a CSS framework to build responsive interfaces* — is fully achieved. |
| **Backend: Python (Flask/Django), Java (Spring Boot), or PHP** | Next.js 15 API Routes (Node.js/TypeScript) | **This is the one deliberate deviation.** The backend implements the same concepts taught in Flask/Django/Spring: REST API endpoints, request validation, file parsing, business logic, rate limiting, authentication (session cookies), and email services. TypeScript was chosen because it allows **one language across the full stack**, shared type definitions between client and server (a software-engineering best practice), and type-safe code. The architectural skills — API design, input validation, layering, error handling — are identical regardless of language. |
| **Database: MySQL or MongoDB** | Google Firestore (NoSQL document database) | Firestore is in the **same category as MongoDB**: a NoSQL document store with collections and JSON-like documents. The project demonstrates the same data-modeling skills — document design, subcollections (`workspaces/{id}/jobs`, `/candidates`, `/members`), real-time listeners, and security rules (the Firestore equivalent of SQL permissions). Firestore additionally provides real-time sync across devices/tabs, which is the reason it was selected over MongoDB Atlas. |
| **AI/ML: Python, Scikit-learn, TensorFlow** | **Python 3 + Flask + Scikit-learn microservice** + custom scoring engine + MiMo LLM API | The project includes a **Python/Flask microservice (`ml-service/`)** using **Scikit-learn**: a TF-IDF vectorizer with cosine similarity computes resume↔JD textual match scores, and a **RandomForest classifier** (200 trees, trained on 6,000 synthetic labeled pairs) predicts match bands with confidence scores. Its results appear in the screening UI alongside the deterministic engine, and the service includes its own Python unit tests (`ml-service/test_app.py`). Additionally, a custom deterministic engine implements NLP/IR techniques — document text extraction, tokenization, skill-taxonomy canonicalization, weighted scoring — and an LLM layer provides qualitative summaries with prompt-injection defenses. |
| **Visualization: Power BI or Tableau** | Interactive web analytics dashboard | The Analytics page delivers the same learning outcome natively in the app: score distributions, funnel conversion rates between pipeline stages, skill-gap analysis (met vs. missing), per-job performance comparisons, and a 14-day activity timeline — all interactive and updating in real time from the database, which a static Power BI export cannot do. An in-app dashboard was chosen so visuals ship with the deployed product rather than in an external tool. |

---

## 3. Why This Stack Was Chosen

1. **Industry relevance** — Next.js + React + TypeScript + Tailwind is among the most in-demand production stacks today (used by Vercel, Twitch, Notion, Hulu). Learning outcomes are best served by tools students will actually use in employment.
2. **One language, full stack** — TypeScript across client and server eliminates an entire class of bugs and demonstrates modern software-engineering practice.
3. **Real deployment** — The project is not a localhost demo. It is live on Vercel with CI via GitHub, environment-based configuration, and a free-tier Firebase backend — demonstrating cloud deployment, DevOps, and cost-conscious architecture.
4. **Tested software engineering** — 51 automated unit/integration tests (Vitest) cover the scoring engine, parsers, validation, and persistence layers, plus typechecking and linting in the build pipeline.
5. **Security & ethics** — The project treats user documents as untrusted input (magic-byte file validation, path-traversal sanitization, rate limiting, prompt-injection defense) and explicitly excludes protected characteristics from scoring — a documented fairness posture exceeding typical course requirements.

---

## 4. Skills Demonstrated (Mapped to Course Outcomes)

- **Frontend engineering** — React hooks, component architecture, state management, responsive design, accessibility (ARIA labels, focus rings), dark mode.
- **Backend engineering** — 10 REST endpoints (`/api/screen`, `/api/apply`, `/api/parse-job`, auth/session, email), multipart file handling, input validation (Zod), rate limiting, error handling.
- **Database engineering** — NoSQL document modeling, real-time listeners, security rules, multi-workspace data isolation, role-based access control (admin/recruiter/viewer).
- **AI/ML application** — NLP text extraction, taxonomy-based entity matching, weighted similarity scoring, LLM integration with safety constraints.
- **Data visualization** — funnel analysis, distributions, comparative analytics, real-time dashboards.
- **Deployment & DevOps** — Git version control, GitHub, Vercel CI/CD, environment variables/secrets management.

---

## 5. Delivered Python & Power BI Components

The project now includes concrete deliverables on the recommended stack:

1. **Python + Flask + Scikit-learn microservice** (`ml-service/app.py`)
   - TF-IDF vectorization + cosine similarity scoring (information retrieval)
   - RandomForest classifier trained on 6,000 synthetic resume↔JD pairs
   - Feature engineering: Jaccard similarity, overlap ratios, shared-term counts
   - Model explainability: top shared terms + feature importances exposed via API
   - 4 Python unit tests (`ml-service/test_app.py`) — all passing
2. **Power BI report** — built from the app's CSV export following `docs/POWERBI_GUIDE.md`: pipeline funnel, score distribution, skill-gap analysis, average score per job, with interactive slicers.
