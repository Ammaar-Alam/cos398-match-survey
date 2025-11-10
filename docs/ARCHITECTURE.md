# Architecture Overview

## Components
- Web App (Next.js 14, App Router)
  - UI routes under `app/*` (e.g., `/`, `/start`, `/survey/[index]`, `/privacy`).
  - API routes under `app/api/*` (`register`, `questions`, `response`, `admin/export`).
- Persistence (PostgreSQL)
  - Connection via `lib/db.ts` using `pg`; Docker service in `docker-compose.yml`.
  - Schema ensured by `scripts/db-init.ts`.
- Orchestration & Tools (TypeScript CLIs in `scripts/*`)
  - `dev-warmup.ts`, `export.ts`, `export-couples.ts`, `run-analysis.ts`.
- Algorithm & Evaluation (Python in `tiger-alg/*`)
  - `models/`, `scoring/`, `eval/`, `matching/`, `tools/`, `ml/`.
  - Produces `tiger-alg/out/*` summaries, scores, and plots.

## Data Flow
1. Participant registration: `/api/register` creates `Couple` and `Participant` rows.
2. Questionnaire: `/survey/[index]` autosaves to `/api/response` (Self, Acceptable, Importance per item).
3. Export: admin requests `/api/admin/export` (or run `npm run export:csv`) → `export.csv`.
4. Couples mapping: `npm run export:couples` → `couples.csv` from pairings by couple code.
5. Metadata: `tiger-alg/tools/build_meta_from_repo.py` reads `data/questions.json` → `meta.json`.
6. Evaluation: `tiger-alg/eval/evaluate_couples.py` computes AUC/ranks (baseline and variants) → `tiger-alg/out/*`.
7. Optional matching: `tiger-alg/matching/*` builds lists and stable matchings from scores.

## Environments & Config
- Local: `docker compose up -d db` → `npm run db:setup` → `npm run dev`.
- Prod: host on Vercel/Supabase or equivalent; set `DATABASE_URL`, `ADMIN_KEY`; TLS enabled (see `lib/db.ts`).
- Env vars: `.env.example` is the source of truth; never commit secrets.

## Sequence (concise)
```
Browser → Next.js UI → API → Postgres
                 │         │
                 └── export.csv ──► tiger-alg (Python)
                                   ├─ meta.json (from data/questions.json)
                                   ├─ evaluate → out/summary_by_variant.csv
                                   └─ (optional) matching → matching.json
```

## References
- Contributor quickstart and commands: `AGENTS.md`.
- Full research and method details: `docs/TigerMatch-PAM-v2.0.md`.
