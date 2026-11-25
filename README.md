# NEC ASoE Exam Prep — 3,180-MCQ Bank, 100-Q Mock Sets & Exam Simulator

A **Next.js (App Router + React 19 + TypeScript + Tailwind CSS)** web application and **Docker container** built for the **Nepal Engineering Council (NEC) Registration Examination — Software Engineering (`ASoE`) Syllabus**.

---

## Key Features

- **Pre-Seeded 3,180-MCQ Bank (All 10 Chapters / 60 Sections)**: All 10 official NEC ASoE workbooks (`data/workbooks/*.xlsx`) are compiled at build time into compact JSON (`public/seed/`) and bulk-seeded in milliseconds into a frontend **IndexedDB v2** database (`nec-asoe-mcq-db`) on first visit.
- **30 Balanced 100-Question / 2-Hour Test Sets (`/sets`)**:
  - Every set selects **exactly 10 questions per chapter** (`Ch 1–10`) and covers **all 60 syllabus sections** (`1–2` questions each) with **zero repeats inside any set**.
  - **Core Sets 1–18**: `1,800` completely unique questions with zero global repeats across sets.
  - **Extended Sets 19–30**: Continues drawing unseen questions from `Ch 2–10` alongside balanced `Ch 1` coverage.
  - **Dynamic Smart Unseen / Weak-Area 100-Q Sets**: Generates fresh randomized 100-question balanced sets prioritizing unseen or previously missed questions.
- **Dual Exam Modes**:
  - **Real NEC Exam Mode**: 2-hour simulation where selections can be changed until submission, and scores + explanations appear at the end.
  - **Practice Lock Mode**: Strict single-choice permanent lock on first click with instant Red/Green feedback and `Reason / Explanation` reveal.
- **Google Sign-In + Local Profiles & Portable Backups**:
  - Optional **Sign in with Google** (via signed `HttpOnly` OAuth2 session cookies) plus multi-user **Local Profiles** and **Export / Restore JSON Backups**.
- **Custom Excel (`.xlsx`) Extractor (`/upload`)**: Lazy-loads SheetJS (`xlsx`) only when uploading custom workbooks, with paginated spoiler-safe browsing and bookmarking.
- **Result Analytics & Remediation (`/results`)**: NEC `50%` pass benchmark, chapter & section accuracy breakdowns, CSV export, print stylesheet, and **Retry Wrong Questions**.
- **Docker Container Ready**: Multi-stage `node:22-alpine` standalone `Dockerfile` + `docker-compose.yml`.

---

## Quick Start (Local Development)

```bash
npm install
npm run build:seed
npm run dev
```

Open **http://localhost:3000** in your browser.

### Optional: Enable Sign in with Google

Copy `.env.example` to `.env.local` and configure your Google OAuth 2.0 Web Client credentials:

```env
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
AUTH_SECRET=a-long-random-32-character-secret
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Set the authorized redirect URI in Google Cloud Console to:
`http://localhost:3000/api/auth/google/callback`

---

## Run with Docker Compose

```bash
docker compose up --build -d
```

- Application URL: **http://localhost:3000**
- Healthcheck API: **http://localhost:3000/api/health**

To stop the container:
```bash
docker compose down
```

---

## Scripts

- `npm run build:seed` — Parses `data/workbooks/*.xlsx` into `public/seed/` (`manifest.json`, `questions.json`, `test-sets.json`).
- `npm run verify:seed` — Verifies 3,180 unique MCQs, 60 sections, scenario context enrichment, and all 30 balanced 100-Q test set invariants.
- `npm run typecheck` — Runs `tsc --noEmit`.
- `npm run build` — Builds the standalone Next.js production app.
