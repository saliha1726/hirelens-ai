# Security, Privacy & Fairness

## Threat model for uploaded documents

Resumes and job descriptions are **untrusted input**. They may be malformed, hostile, or crafted to manipulate the pipeline ("prompt injection"). HireLens treats them strictly as data:

- **File validation** — extension allowlist (pdf/docx/txt/md), 5 MB per-file cap, 10 files per request, empty-file rejection, magic-byte sniffing (`%PDF-`, `PK`) so a renamed `.exe` is rejected even if the extension lies.
- **Text sanitization** — control characters and zero-width/invisible Unicode are stripped; input length capped at 60k chars before any parsing or AI usage.
- **Prompt-injection defense (defense in depth)**
  1. Scores are computed deterministically *before* any AI call — injected text cannot change numbers.
  2. The AI layer receives structured facts (identifiers stripped) inside `<resume_data>` tags declared untrusted, with explicit system instructions to ignore embedded instructions.
  3. AI output is schema-constrained JSON parsed defensively; unexpected shapes are discarded.
  - Verified during development: a resume containing "ignore all previous instructions…" is flagged as suspicious content, never followed.
- **Safe error handling** — per-file errors return generic reasons; stack traces never reach the client; no raw document content is echoed in error messages.

## Secrets

- `GEMINI_API_KEY` lives only in environment variables (`.env.local` locally, Vercel encrypted env vars in production). It is git-ignored, never sent to the browser, never logged. `/api/health` reports only a boolean `aiEnabled`.
- No other secrets exist in v1 (no database). If one is added later, it follows the same rule: server-side env vars only.

## API boundaries & abuse resistance

- All AI/document endpoints are `POST` with strict zod/manual validation and bounded body sizes.
- In-memory sliding-window rate limiting: screening 8 req/min/IP, parse-job 20 req/min/IP, `429` + `Retry-After` on breach. *Known limitation:* on serverless this counter is per-instance; for serious scale add a shared store (e.g., Upstash Redis) at the same call sites.
- Security headers (`X-Frame-Options: DENY`, `nosniff`, restrictive `Referrer-Policy`, `Permissions-Policy`) set globally.

## Privacy posture (v1)

- **No server-side storage of resumes.** Files are processed in-memory during the request and discarded; persistence is the recruiter's own browser (localStorage workspace).
- **Data minimization to AI:** names/emails/phones/locations are removed from profiles before Gemini calls; only role-relevant structured facts and bounded highlight snippets are sent.
- No third-party analytics, ads, or tracking scripts. No cookies beyond theme preference/localStorage.

## Fairness & hiring safety

HireLens is **decision support** — a triage assistant. It does not reject candidates and must not be used as an automated decision system.

Excluded from scoring inputs and explicitly forbidden to the AI layer:
race, ethnicity, religion, gender, sexual orientation, age/birthdate, disability or medical information, pregnancy/family status, political affiliation.

Concretely:
- The scoring engine only consumes job-relevant structure: skills, roles, durations, education level/field, certifications, domain keywords.
- Personal characteristics extracted from resumes are ignored; they are not factors anywhere in the model.
- The AI system prompt repeats these exclusions verbatim and forbids referencing such attributes in output.
- Every score displays its full math (factors, weights, evidence quotes) so recruiters can audit *why* rather than defer to a number.

## Reporting

Found a security issue? Open a private security advisory on the GitHub repository rather than a public issue.
