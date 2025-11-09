## Why a custom web app (vs. Qualtrics) for this use‑case

**Pros of custom app**

* **All three sub‑responses per item on one screen** (self answer + acceptable partner answers + importance), with **arrow‑key navigation** and **micro‑animations** to cut friction and fatigue.
* **Exact data schema** that mirrors your research needs: export wide CSV with columns `SELF_Q*`, `ACC_Q*`, `IMP_Q*` so you can “drop in” algorithms offline with zero munging.
* **Precise control over defaults** (e.g., Likert acceptable range defaults to ±1 step; importance defaults to “A little (1)”) and instrumentation (time per item, completion).
* Easier to **version and reproduce** for publication.

**Cons / trade‑offs**

* You own **security & ops** (but for 60 participants total, this is manageable).
* Must ensure **IRB‑grade consent & privacy** (straightforward: static consent page + secure Postgres + limited access).
* Qualtrics has “no code” convenience and built‑in audit logs; but its UI makes the OkCupid‑style triad clunky.

Given your target (n=60 individuals now, larger pilot later) and the desire to **minimize fatigue** and **export exactly what your offline pipeline expects**, the **custom app is the better fit**. For the *matching research background and fairness properties we’ll leverage in later phases* (stable matching, randomized mechanisms), see COS 445 lecture notes for context.  

---

# Context for the outside implementer (what this app is and isn’t)

* **What this app does:** Shows **one question per page**. Each page collects three things:

  1. **Your answer** (SELF)
  2. **Acceptable partner answers** (ACC)
  3. **Importance** (IMP) on a 5‑level scale (0,1,10,50,250)

* **What this app does *not* do:** It **does not compute any match**. We will run algorithms offline later against the exported CSV to evaluate accuracy on couples who have been together for ≥ 12 months.

* **Participants:** Couples supply **Couple Code + Full Name + Princeton NetID** (no login). Each partner independently completes the same 50 items.

* **Export:** Admin can download a **wide CSV** with columns:

  ```
  participantId,coupleCode,fullName,netId,
  SELF_Q1..SELF_Q50, ACC_Q1..ACC_Q50, IMP_Q1..IMP_Q50
  ```

---

# System architecture (chosen stack)

* **Frontend:** React (Next.js 14 App Router), **TailwindCSS**, **Framer Motion** for animations
* **Backend:** Next.js API routes (**Node.js/TypeScript**)
* **DB:** **PostgreSQL** with **node-postgres (pg)**
* **Auth:** None (by design). Entry screen collects **Couple Code + NetID + Name** and issues a `participantId` stored locally for the session.
* **Hosting:** Vercel (frontend + API) + Neon/Supabase (managed Postgres) in production; Dockerized Postgres for local dev.

---

# Directory structure

```
tigermatch-couples-survey/
├─ app/
│  ├─ page.tsx                  # Intro/landing
│  ├─ privacy/page.tsx          # Privacy page
│  ├─ start/page.tsx            # “Register” (Couple Code, Name, NetID)
│  ├─ survey/[index]/page.tsx   # One-question-per-page (triad UI)
│  ├─ done/page.tsx             # Thank you
│  └─ api/
│     ├─ register/route.ts      # POST create/join couple & participant
│     ├─ questions/route.ts     # GET list of items
│     ├─ response/route.ts      # POST upsert one response
│     └─ admin/export/route.ts  # GET CSV export (admin key)
├─ components/                  # (Optional future: shared UI components)
├─ data/
│  └─ questions.json            # 50 items with response types & options
├─ lib/
│  └─ db.ts                     # pg pool client
├─ scripts/
│  └─ db-init.ts                # Create tables (Postgres SQL via node-postgres)
├─ scripts/
│  ├─ seed.ts                   # Seed DB with 50 items
│  └─ export.ts                 # CLI export (same shape as API export)
├─ public/                      # Static assets
├─ README.md                    # This playbook + setup
├─ package.json
├─ tailwind.config.ts
├─ postcss.config.js
├─ tsconfig.json
└─ .env.example
```

---

## Data model (PostgreSQL)

We use plain SQL tables managed by a small init script. Questions/options are served from `data/questions.json` and are not stored in DB.

Tables:
- couples(id UUID PK, code TEXT UNIQUE, months_together INT, created_at TIMESTAMPTZ)
- participants(id UUID PK, couple_id UUID FK couples(id), full_name TEXT, net_id TEXT, email TEXT, started_at TIMESTAMPTZ, completed_at TIMESTAMPTZ)
- responses(id UUID PK, participant_id UUID FK participants(id), question_id TEXT, self_answer TEXT, acceptable TEXT, importance INT, created_at TIMESTAMPTZ, updated_at TIMESTAMPTZ, UNIQUE(participant_id, question_id))

---

# Frontend flows & UX details

* **Landing (`/`)**: short study explainer, CTA, links to Privacy. Smooth **fade‑in** and motion from Framer Motion.

* **Start (`/start`)**: form for **Couple Code + Full Name + NetID (+ optional email, months together)** → `POST /api/register` → stores `participantId` in `localStorage` → redirects to `/survey/1`.

* **Survey (`/survey/[index]`)**:

  * **One item per page** with a **progress indicator** (e.g., 1/50 = 2%).
  * **Your answer** section:

    * **Likert:** 7, 6, or 5 labeled buttons (numbers shown; keep anchors in the paper/consent).
    * **MC single/multi:** selectable cards for each option.
  * **Acceptable partner answers**:

    * **Likert:** `Same`, `±1`, `±2`, `Any`.
    * **MC:** multi‑select of the item’s options.
  * **Importance**: `Irrelevant (0)`, `A little (1)`, `Somewhat (10)`, `Very (50)`, `Mandatory (250)`.
  * **Keyboard navigation**: `←` back, `→` next (blocked until SELF selected).
  * **Auto‑save**: every Next/Back posts to `/api/response` (idempotent upsert).
  * **Animations**: subtle slide in/out on question transitions.

* **Done (`/done`)**: confirmation; instruct partner to use the same **Couple Code**.

---

# API contracts (simple JSON)

* **POST `/api/register`**
  Request:

  ```json
  { "coupleCode": "TIGER-1234", "fullName": "A. Student", "netId": "as1234", "email": "", "monthsTogether": 18 }
  ```

  Response:

  ```json
  { "participantId": "cuid..." }
  ```

* **GET `/api/questions`**
  Response:

  ```json
  [
    { "id":"Q1","text":"I see myself as extraverted, enthusiastic.","responseType":"Likert7","options":[] },
    { "id":"Q32","text":"Your ideal weekend evening is usually:","responseType":"MC_SINGLE","options":[{"label":"Quiet with 1–2 close friends","value":"1"}, ...] }
    ...
  ]
  ```

* **POST `/api/response`**
  Request:

  ```json
  {
    "participantId":"cuid...",
    "questionId":"Q34",
    "selfAnswer":"3",
    "acceptable":"{\"mode\":\"range\",\"tol\":\"±1 step\"}",
    "importance":10
  }
  ```

  Response: `{ "ok": true }`

* **GET `/api/admin/export?key=ADMIN_KEY`**
  Returns `text/csv` attachment of wide table:

  ```
  participantId,coupleCode,fullName,netId,SELF_Q1,...,ACC_Q1,...,IMP_Q1,...
  ```

---

# The 50 items (seeded)

* **TIPI (10)** — 7‑point
* **PVQ‑21 (21)** — 6‑point *(paraphrased here; swap in ESS official wording before publishing)*
* **Social (4)**, **Communication/Friendship (5)**, **Lifestyle (6)**, **Priorities/Deal‑breakers (4)**

All 50 are already in `data/questions.json` and seeded into the DB via `npm run seed`.
*(We preserved your structure and triad per item; this is the same content you approved for QSF, adapted to our UI.)*

---

# Security & privacy notes

* No formal login; minimal identifiers (NetID, name).
* Use **managed Postgres with TLS** (Neon/Supabase). Store backups encrypted.
* Protect `/api/admin/export` with a strong `ADMIN_KEY` (rotate per study).
* Keep raw data accessible only to PI + named RAs; document in IRB.

---

# How to run locally

```bash
# 1) Configure environment
cp .env.example .env
# Set DATABASE_URL (Postgres) and ADMIN_KEY

# 2) Database
npm install
npx prisma generate

# 3) Create schema & seed 50 items
npm run db:migrate
npm run seed

# 4) Start dev server
npm run dev
# http://localhost:3000
```

**Admin export locally:**

```
curl -L "http://localhost:3000/api/admin/export?key=YOUR_ADMIN_KEY" -o export.csv
```

---

# Design/engineering choices that support publishable research

1. **One‑screen triad** minimizes mode switches and mis‑clicks; arrow keys speed progress → lower fatigue and cleaner data.
2. **Export schema matches your offline harness**, preventing post‑hoc reshaping errors.
3. **Construct‑labeled questions** (TIPI, PVQ, etc.) ease later validity checks.
4. **Seeding & versioning** gives stable, reproducible instruments across cohorts.
5. **No scoring in app** keeps the data collection layer decoupled from analysis, improving auditability.

---

## Files you just got (highlights)

* `app/survey/[index]/page.tsx` — **the one‑question page** with triad UI, arrow‑key nav, autosave & transitions.
* `app/api/response/route.ts` — **idempotent upsert** per item (SELF/ACC/IMP).
* `scripts/export.ts` & `/api/admin/export` — produce **exactly** the CSV you need.
* `data/questions.json` + `scripts/seed.ts` — seed **all 50 items** with response types & options.

> If you later decide to measure **time‑on‑item** or **revision frequency**, we can add columns to `Response` and an `Event` log. If you pilot at scale, we can add a simple rate limiter and couple‑code rate limits.

---

### Background (for your “methods” and advisor deck)

* You’ll evaluate “OkCupid‑style” triads with importance weighting **offline** on this dataset; later, you’ll transform compatibility scores to **ordinal preference lists** and study **stable matching** properties (e.g., DA’s truthfulness for proposers, equal‑treatment‑of‑equals in randomized variants, etc.) on pilot cohorts. See COS 445 notes for formal definitions and properties of stability, DA, RSD, and probabilistic serial mechanisms (useful in fairness discussions).  
