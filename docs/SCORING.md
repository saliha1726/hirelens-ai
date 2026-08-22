# AI Scoring Methodology

## Principles

1. **Deterministic first.** The overall match score is produced by rule-based code, never by a language model. The same resume against the same job always yields the same score.
2. **Explainable by construction.** Every factor reports a sub-score, its weight, and a plain-language detail line. Strengths and gaps are *derived from* factor outcomes, not invented.
3. **AI interprets; AI does not score.** Gemini receives the already-computed analysis and writes a qualitative interpretation (summary, strengths, concerns, interview focus, band). It is structurally incapable of moving the number.

## Factor model

Weights sum to 100 so the overall score is the weighted average of factor scores:

| Factor | Weight | How it is computed |
|---|---|---|
| Required skills | **40** | Coverage of job-required skills found in the parsed profile or raw text, via a ~200-entry skill taxonomy with alias normalization (`reactjs` ≡ React). Multi-word skills earn 50% partial credit for token overlap. |
| Relevant experience | **18** | Overlap between the job's domain/keyword vocabulary and the candidate's role titles & companies (60%), blended with seniority alignment to the job's target level (40%). |
| Years of experience | **12** | Candidate total (merged, overlap-free intervals from dated roles) vs. the job's stated minimum: ≥125% → 100, meets → 95, 85–100% → 80, 60–85% → 55–80 linear, below → steep decay. |
| Preferred skills | **10** | Coverage of nice-to-have skills (same matching machinery). |
| Education | **8** | Ranked ladder (none < high-school < diploma < associate < bachelor < master < doctorate) vs. requirement; field match checked; exceeding adds a small bonus; `strict` requirements penalize field mismatch. |
| Certifications | **6** | Fraction of job-required certifications detected (known-cert list + section parsing). |
| Job-specific keywords | **6** | Salient non-skill JD keywords present in the resume text (word-boundary aware). |

## Output contract

For every candidate/job pair the engine returns:

- `overallScore` (0–100)
- `factors[]` — score + weight + human explanation per factor
- `matchedSkills` / `missingSkills` / `skillGaps.partial`
- `strengths[]` and `gaps[]` (severity: critical / moderate / minor, weighted by factor impact)
- `experienceComparison` (verdict: exceeds / meets / below / unknown)
- `keywordHits[]` and `evidence[]` — short quotes from the resume where each signal was found

## AI interpretation layer

Given the structured profile, requirements and the deterministic result, Gemini returns JSON with: `summary`, `topStrengths`, `concerns`, `interviewFocus`, `recommendationBand`. Guardrails:

- Resume data is embedded in `<resume_data>` tags explicitly declared **untrusted data**; instructions inside are to be ignored (verified with an injection probe during development).
- Identifiers (name, email, phone, location) are stripped before the model sees the profile.
- Protected characteristics are excluded by system instruction (see SECURITY.md).
- Failure is graceful: the UI shows "AI interpretation unavailable — the deterministic score is unaffected."

## Known limitations

- Heuristic parsing can miss unusual resume layouts; `confidence` and `parseWarnings` surface uncertainty rather than hiding it.
- Keyword/term matching rewards resumes that *describe* relevant work — it cannot verify truthfulness. Interview verification is the recruiter's role (the AI's `interviewFocus` supports exactly that).
- Weights are a defensible default, not gospel; they are constants in `src/lib/scoring/engine.ts` and easy to tune.
