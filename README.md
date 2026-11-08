# NEC ASoE Excel MCQ Extractor & Interactive Exam Simulator

A **Next.js (App Router + React 19 + TypeScript + Tailwind CSS)** web application and **Docker container** built for the **Nepal Engineering Council (NEC) Registration Examination — Software Engineering (`ASoE`) Syllabus**.

---

## Key Features

- **Excel (`.xlsx`) Upload & Multi-Tab Extractor**: Upload multi-sheet NEC workbooks (such as `NEC_ASoE_Ch1_Fundamentals_of_IT_180_MCQs.xlsx` with `Summary` + tabs `1.1`–`1.6`) or custom spreadsheets. Extracts questions, options `A–D`, `Correct` keys, and `Reason / Explanation` automatically.
- **Complete 10-Chapter / 60-Section NEC `ASoE` Syllabus**: Embedded official syllabus (`ASoE0101` through `AALL1006`) with live question bank coverage tracking.
- **Chapter-Wise & Section-Wise Question Generator**: Filter by any Chapter (`1`–`10`) or Sub-section (`1.1`–`10.6`), choose question counts (`10`, `20`, `30`, `50`, `100`, `All`), balanced section sampling, randomized order, and optional exam countdown timers.
- **Strict Single-Choice Permanent Lock**: Once an option (`A`, `B`, `C`, or `D`) is chosen on a question, **it locks permanently and cannot be selected or changed again** (persisted in `IndexedDB` across reloads).
- **Instant Correct Answer + Valid Reason Reveal**:
  - Choosing a **wrong option** highlights your pick in **Red**, immediately highlights the **Correct Option in Green**, and displays the **`Reason / Explanation`** so you understand *why*.
  - Choosing the **correct option** highlights in **Green** and displays the **`Reason / Explanation`** to reinforce learning.
- **Proper Exam Result & Analytics**: Score, percentage, NEC `50%` Pass/Fail status, pace metrics, Chapter & Section breakdown table, filterable review (`Wrong` / `Correct` / `Skipped`), CSV export, print stylesheet, and one-click **Retry Wrong Questions**.
- **Docker Container Ready**: Multi-stage `node:22-alpine` standalone `Dockerfile` + `docker-compose.yml`.

---

## Quick Start (Local Development)

```bash
npm install
npm run dev
```

Open **http://localhost:3000** in your browser.

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

## Project Architecture & Phase Docs

Detailed architecture and phase specifications are available in [`./docs/README.md`](./docs/README.md).


# Nec-Prep 🚀

**Nec-Prep** is a streamlined, full-stack examination preparation platform designed for educators, trainers, and students. By simply uploading an Excel spreadsheet (`.xlsx`) populated with questions, the platform instantly parses the data and boots up a live, interactive exam environment.

## ✨ Key Features
* **Excel-to-Exam Pipeline:** Drag and drop or upload structured question banks via Excel spreadsheets for instant parsing.
* **Live Test Interface:** Clean, distraction-free test-taking UI with real-time timer, question navigation, and state tracking.
* **Automated Evaluation:** Instant scoring, review breakdowns, and performance feedback upon test submission.
* **Scalable Architecture:** Built for fast query processing, smooth state management, and seamless deployment.

## 🛠️ Tech Stack
* **Frontend:** React / Next.js, Tailwind CSS
* **Backend:** Node.js / FastAPI / Express
* **Database / Parsing:** PostgreSQL / MongoDB, SheetJS (xlsx) parser utilities
