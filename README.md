# TigerMatch Couples Survey — Minimal Web App (Next.js + Tailwind + PostgreSQL)

**Purpose:** collect questionnaire data from **couples (30 couples = 60 individuals)** who have been together for 12+ months.  
This app **only collects data**. All scoring/matching will be performed offline on exported CSV.

**Context (for the implementer):**
- Research compares algorithm variants for compatibility. Items capture **self answer**, **acceptable partner answers**, and **importance** per question (OkCupid-style). The campus-scale system later uses stable matching on ordinal preferences; for background on matching and fairness, see the course notes on DA/RSD and randomized mechanisms. (COS 445 refs provided by PI.) 
- This app must minimize fatigue: one item per page, keyboard arrows to navigate, fast autosave. 

## Tech choices
- **Next.js 14 (App Router)** + **TypeScript** for a simple full-stack.
- **TailwindCSS** + **Framer Motion** for styling and micro-animations.
- **PostgreSQL** via pg (node-postgres) for persistence.
- **No auth** (by request): participants enter **Couple Code**, **Full name**, **Princeton NetID**. A `participantId` is stored in localStorage for the session.
- **Export** endpoint returns a wide CSV with columns `SELF_Q*`, `ACC_Q*`, `IMP_Q*`, and `IMP_LABEL_Q*` ready for downstream scoring.

## Getting started
```bash
cp .env.example .env    # set DATABASE_URL and ADMIN_KEY
npm install
npm run db:setup        # starts postgres (docker) and creates tables
npm run dev             # starts Next.js dev server
```

### Local testing workflow (end-to-end)
1) Open two browser sessions (one incognito) on `http://localhost:3000`.
2) Both participants go to `/start`, enter the SAME Couple Code and their own Full Name/NetID. This creates records in Postgres.
3) Complete the survey. Q47 now enforces “Select up to 3” and allows Next once you’ve set Self, Acceptable, and Importance.
4) Export data locally:
```bash
# from project root
npm run export:csv   # writes export.csv in the repo root
npm run export:couples  # writes couples.csv inferred from pairs per couple code
```
5) Run the algorithm (AUC + per-couple scores):
```bash
cd tiger-alg
pip install -r requirements.txt
python tools/build_meta_from_repo.py --questions_json ../data/questions.json --export_csv ../export.csv --out meta.json
python eval/evaluate_couples.py --export_csv ../export.csv --couples_csv ../couples.csv --meta_json meta.json --questions_json ../data/questions.json --outdir out
```
Outputs will be in `tiger-alg/out/`.

### Local Postgres via Docker (recommended)
```bash
# from project root
docker compose up -d db
# create tables
npm run db:setup
```

### One-command dev workflow
- Make sure Docker Desktop is running.
- From project root:
  - First-time setup: `npm run db:setup` (starts DB, generates client, applies migrations, seeds questions)
  - Day-to-day: `npm run dev` (auto-starts DB and applies migrations if any)

Useful commands:
- `npm run db:status` — check DB container health/ports
- `npm run db:up` / `npm run db:down` — start/stop DB container

## Data model
- `Couple(id, code, monthsTogether)` — created on first registration with a given code.
- `Participant(id, coupleId, fullName, netId, email?, startedAt, completedAt)`
- `Question(id, section, domain, construct, text, responseType, order)`
- `Option(id, questionId, label, value, ord)`
- `Response(participantId, questionId, selfAnswer, acceptable, importance)`

`acceptable` is JSON-encoded per item (with lightweight meta for data quality such as `meta.tMs` time-on-item in ms):
- Likert: `{mode:'range', tol:'Any answer|±2 steps|±1 step|Same answer'}`  
- MC: `{mode:'options', opts:['1','3',...]}`

## Routes / UI
- `/` — intro page, study context, CTA.
- `/start` — register with **Couple Code**, **Full name**, **NetID**, optional email/months.
- `/survey/[index]` — one question per page, **triad** UI (self / acceptable / importance), **arrow‑key** nav, progress %. Likert items display verbal anchors (TIPI 7‑point agree, PVQ 6‑point PVQ portraits). Acceptable defaults after selecting your self‑answer: **±2 steps for 7‑point** items and **±1 step for 6‑point** items (you can change it).
- `/done` — thank-you page.
- `/privacy` — static.
- `/api/register` — POST to create or join couple; returns `{ participantId }` (stored client-side).
- `/api/questions` — GET questions + options.
- `/api/response` — POST upsert a single response.
- `/api/admin/export` — GET CSV (requires `x-admin-key` or `?key=` matching `ADMIN_KEY`).

## Export
- Admin requests: `GET /api/admin/export?key=YOUR_ADMIN_KEY`  
- CSV columns: `participantId,coupleCode,fullName,netId,SELF_Q1..50,ACC_Q1..50,IMP_Q1..50,IMP_LABEL_Q1..50`

### One-command workflow (export → couples → evaluate)
From project root, with either DATABASE_URL set (DB export) or ADMIN_EXPORT_URL + ADMIN_KEY set (API export):

```
npm run alg:run
```

This CLI will:
- Fetch/export `export.csv` (via admin API if `ADMIN_EXPORT_URL` is set, otherwise via DB)
- Build `couples.csv` by pairing first two participants per Couple Code
- Build `tiger-alg/meta.json`
- Run the evaluation and write outputs to `tiger-alg/out/`

## Notes for production
- Put Postgres behind SSL (Neon/Supabase). 
- Restrict CORS to your domain.
- Rotate `ADMIN_KEY` frequently.
- Add server-side throttling on `register`/`response` to avoid abuse.
- For IRB: host consent & privacy pages; keep identifiers minimal; encrypt backups.
 - Vercel/Supabase: set one of `DATABASE_URL` or `POSTGRES_URL` to your Supabase connection string (pooled or non-pooled). If you see `SELF_SIGNED_CERT_IN_CHAIN`, set `ALLOW_SELF_SIGNED=true` or ensure TLS CA is trusted. Our client also auto-enables TLS for `sslmode=require`/Supabase hosts.

### Pre-issuing Couple Codes (admin)
- Local script: `npm run couple:create` then follow prompts to create a couple code and the two participant records.
- GitHub Action: `.github/workflows/create-couple.yml` provides a `workflow_dispatch` to create a code + two names against a DB. Add a repository secret `DATABASE_URL` pointing to your production DB.

## Replace PVQ wording
PVQ-21 in `data/questions.json` is paraphrased; replace with the official ESS PVQ‑21 portraits and keep the 6‑point anchors for publication-grade fidelity. If you provide the official text, we can import it directly into `data/questions.json`.

## Optional quality check (IMC)
Set `ENABLE_IMC=true` in the environment to inject a single instructional manipulation check (IMC) item in the middle of the survey (asks respondents to select 3 = “Somewhat”). This is flagged only in data for offline QC; it does not gate completion.

## Keyboard navigation and UX
- Right/Left arrows = Next/Back
- Default acceptable: `Likert7 → ±2 steps`, `Likert6 → ±1 step`; default importance = `A little (1)`
- Q47 (Top priorities) now enforces a maximum of 3 selections for Self.
- Mobile-friendly hit targets for choices.
