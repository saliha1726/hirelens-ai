# Deployment

## Target platform

Vercel (serverless Node.js runtime). The GitHub repository `saliha1726/hirelens-ai` is the canonical source; deployments are driven by the Vercel CLI in CI-like fashion and can be connected to Git for automatic deploys on push.

## Environment variables

| Variable | Where | Required | Notes |
|---|---|---|---|
| `GEMINI_API_KEY` | Vercel project env vars (Production/Preview/Development) | recommended | Google AI Studio key. Without it, everything works except AI interpretation. |
| `GEMINI_MODEL` | optional | no | Defaults to `gemini-flash-latest` with automatic fallback to `gemini-2.5-flash` / `gemini-3.5-flash`. |

Set them with:

```bash
vercel env add GEMINI_API_KEY production
```

…or let the deploy script do it (values are passed via stdin, never written to disk or logs).

## Deploy steps (CLI)

```bash
npm run check        # typecheck + lint + tests + production build locally first
vercel link          # one-time: associate the directory with the Vercel project
vercel --prod        # deploy to production
```

## Post-deploy verification checklist

1. `GET /api/health` → `{ ok: true, aiEnabled: true }`
2. Landing page renders (`/`)
3. Dashboard loads demo data (`/dashboard`)
4. Full screening run via UI: paste JD + upload a TXT/PDF resume → ranked result with factor breakdown and AI insight
5. Invalid file rejected client- and server-side with a friendly error
6. Browser console free of errors; network tab shows no key material anywhere

## Rollback

Every deployment is immutable in Vercel — roll back from the Vercel dashboard (Deployments → … → Promote to Production) or redeploy a previous git SHA.
