
# TigerMatch Couples Survey — Minimal Web App (Next.js + Tailwind + Prisma + PostgreSQL)

**Purpose:** collect questionnaire data from **couples (30 couples = 60 individuals)** who have been together for 12+ months.  
This app **only collects data**. All scoring/matching will be performed offline on exported CSV.

**Context (for the implementer):**
- Research compares algorithm variants for compatibility. Items capture **self answer**, **acceptable partner answers**, and **importance** per question (OkCupid-style). The campus-scale system later uses stable matching on ordinal preferences; for background on matching and fairness, see the course notes on DA/RSD and randomized mechanisms. (COS 445 refs provided by PI.) 
- This app must minimize fatigue: one item per page, keyboard arrows to navigate, fast autosave. 

## Tech choices
- **Next.js 14 (App Router)** + **TypeScript** for a simple full-stack.
- **TailwindCSS** + **Framer Motion** for styling and micro-animations.
- **Prisma** ORM + **PostgreSQL** for persistence.
- **No auth** (by request): participants enter **Couple Code**, **Full name**, **Princeton NetID**. A `participantId` is stored in localStorage for the session.
- **Export** endpoint returns a wide CSV with columns `SELF_Q*`, `ACC_Q*`, `IMP_Q*` ready for downstream scoring.

## Getting started
```bash
cp .env.example .env    # set DATABASE_URL and ADMIN_KEY
npm install
npm run db:setup        # starts postgres (docker) and creates tables
npm run dev             # starts Next.js dev server
```

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

`acceptable` is JSON-encoded per item:
- Likert: `{mode:'range', tol:'Same|±1 step|±2 steps|Any answer'}`  
- MC: `{mode:'options', opts:['1','3',...]}`

## Routes / UI
- `/` — intro page, study context, CTA.
- `/start` — register with **Couple Code**, **Full name**, **NetID**, optional email/months.
- `/survey/[index]` — one question per page, **triad** UI (self / acceptable / importance), **arrow‑key** nav, progress %.
- `/done` — thank-you page.
- `/privacy` — static.
- `/api/register` — POST to create or join couple; returns `{ participantId }` (stored client-side).
- `/api/questions` — GET questions + options.
- `/api/response` — POST upsert a single response.
- `/api/admin/export` — GET CSV (requires `x-admin-key` or `?key=` matching `ADMIN_KEY`).

## Export
- Admin requests: `GET /api/admin/export?key=YOUR_ADMIN_KEY`  
- CSV columns: `participantId,coupleCode,fullName,netId,SELF_Q1..50,ACC_Q1..50,IMP_Q1..50`

## Notes for production
- Put Postgres behind SSL (Neon/Supabase). 
- Restrict CORS to your domain.
- Rotate `ADMIN_KEY` frequently.
- Add server-side throttling on `register`/`response` to avoid abuse.
- For IRB: host consent & privacy pages; keep identifiers minimal; encrypt backups.

## Replace PVQ wording
PVQ-21 in `data/questions.json` is paraphrased; replace with the official ESS PVQ‑21 portraits and keep the 6‑point anchors for publication-grade fidelity.

## Keyboard navigation and UX
- Right/Left arrows = Next/Back
- Default acceptable (Likert) = `±1 step`; default importance = `A little (1)`
- Mobile-friendly hit targets for choices.
