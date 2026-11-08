# Phase 5: Proper Exam Results, Syllabus Analytics & Review

## 1. Objective
Provide a comprehensive, actionable **Post-Exam Result & Syllabus Performance Report** (`/results/[sessionId]` and `/results`) that upgrades the static Excel `Summary` sheet into an interactive analytics dashboard with chapter/section mastery tracking, detailed mistake review, and one-click targeted re-testing.

---

## 2. Core Metrics & Scoring Model (`src/lib/scoring.ts`)

For an `ExamSession` with $N$ total questions, $A$ attempted questions, $C$ correct answers, and $W = A - C$ wrong answers ($S = N - A$ skipped):

- **Total Score**: $C \text{ / } N$ (1 mark per question; NEC Registration Exam standard has no negative marking).
- **Overall Percentage**: $\frac{C}{N} \times 100\%$
- **Attempt Accuracy (Precision)**: $\frac{C}{\max(A, 1)} \times 100\%$
- **NEC Benchmark Status**:
  - **PASS** if Overall Score $\ge 50\%$ (NEC Registration Examination passing benchmark)
  - **NEEDS IMPROVEMENT** if $< 50\%$
- **Pace Metrics**: Total elapsed time (`mm:ss`) and average seconds per attempted question.

---

## 3. Result Page Sections (`src/app/results/[sessionId]/page.tsx`)

### 3.1 Executive Scorecard Hero (`<ScoreHero />`)
- Large radial/ring score gauge showing **Score (`e.g., 24 / 30 — 80%`)** and **PASS / FAIL Badge**.
- KPI stat cards:
  - **Correct**: `24` (Emerald)
  - **Wrong**: `5` (Red)
  - **Skipped / Unattempted**: `1` (Amber/Slate)
  - **Accuracy on Attempted**: `82.8%`
  - **Time Taken**: `14m 22s` (`29.7s / question`)

### 3.2 Chapter & Section Breakdown Table (`<SectionBreakdownTable />`)
Directly mirrors and upgrades the `Summary` tab in `NEC_ASoE_Ch1_Fundamentals_of_IT_180_MCQs.xlsx`:

| Section | NEC Code | Topic | Questions | Attempted | Correct | Wrong | Accuracy | Status |
| :--- | :--- | :--- | :---: | :---: | :---: | :---: | :---: | :--- |
| `1.1` | `ASoE0101` | Introduction to Information Technology | 5 | 5 | 5 | 0 | 100% | Strong |
| `1.2` | `ASoE0102` | Storage System | 5 | 5 | 4 | 1 | 80% | Good |
| `1.4` | `ASoE0104` | Computer Networks | 5 | 5 | 2 | 3 | 40% | **Needs Focus** |

- Automatically highlights **Weak Sections (`< 50%`)** and offers a **"Practice Weak Sections"** button right from the report.

### 3.3 Interactive Question-by-Question Review (`<ReviewQuestionList />`)
- **Filter Tabs**:
  - `All Questions (N)`
  - `Wrong Only (W)` *(focused mistake review)*
  - `Correct (C)`
  - `Skipped / Unanswered (S)`
- **Section Filter & Search**: Filter review cards by syllabus section (`1.1`–`10.6`) or keyword.
- Each review card displays:
  - Question text + Syllabus badge (`1.4 • ASoE0104`).
  - All 4 options (`A–D`) clearly marking **Your Locked Choice** vs **Correct Answer** (or `"Not Attempted"` if skipped, while still revealing the Correct Answer + Reason!).
  - Full **`Reason / Explanation`** box so every mistake or skipped question turns into a clear learning takeaway.

### 3.4 Smart Follow-Up Actions
1. **Retry Wrong & Skipped Questions (`W + S`)**: Immediately spins up a new mini-exam containing only the questions missed or skipped in this session!
2. **Generate Fresh Exam (Same Syllabus Scope)**: Samples a brand-new randomized set from the same chapters/sections.
3. **Export / Print Report**: Clean print/PDF stylesheet (`@media print`) + JSON/CSV result summary download.
4. **Results History (`/results`)**: Chronological log of all past exam attempts with score trend, date, chapters tested, and link to reopen any report.

---

## 4. Acceptance Criteria (Definition of Done)
- [ ] Score, percentage, attempted, wrong, and skipped counts sum consistently ($C + W + S = N$) in all cases (including partial submission or timer expiry).
- [ ] Section-wise breakdown accurately aggregates metrics by NEC section (`1.1`–`10.6`) and chapter (`1`–`10`).
- [ ] Filtering by **Wrong Only** shows every missed question with the user's wrong choice, the green correct option, and the valid `Reason / Explanation`.
- [ ] **"Retry Wrong Questions"** launches a valid locked exam session populated exclusively with those missed questions.

