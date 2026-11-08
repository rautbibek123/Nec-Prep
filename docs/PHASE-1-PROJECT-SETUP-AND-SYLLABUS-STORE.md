# Phase 1: Project Setup, Syllabus Engine & Persistent Data Layer

## 1. Objective
Initialize a clean, modular **Next.js (App Router, React 19, TypeScript, Tailwind CSS)** codebase, encode the complete **10-Chapter / 60-Section NEC Software Engineering (`ASoE`) Syllabus** as a strongly-typed registry, and build the local persistent storage layer (`IndexedDB`) for storing extracted Excel question banks and exam attempt records.

---

## 2. Planned Directory Structure

```text
MCQ-TEST/
├── docs/                                # Architecture & phased specs (.md)
├── public/
│   └── samples/                         # Optional sample Excel template / Ch1 dataset
├── src/
│   ├── app/
│   │   ├── layout.tsx                   # App shell, navigation bar, theme & metadata
│   │   ├── page.tsx                     # Dashboard: Syllabus coverage, quick start, upload CTA
│   │   ├── upload/
│   │   │   └── page.tsx                 # Excel (.xlsx) Upload, Preview & Question Bank Manager
│   │   ├── generator/
│   │   │   └── page.tsx                 # Chapter-wise & Section-wise Exam Generator
│   │   ├── exam/
│   │   │   └── [sessionId]/
│   │   │       └── page.tsx             # Locked Interactive MCQ Exam Runner
│   │   ├── results/
│   │   │   ├── page.tsx                 # Past Exam Attempts History
│   │   │   └── [sessionId]/
│   │   │       └── page.tsx             # Proper Exam Scorecard, Syllabus Breakdown & Review
│   │   └── syllabus/
│   │       └── page.tsx                 # Interactive 10-Chapter NEC ASoE Syllabus Explorer
│   ├── components/
│   │   ├── layout/                      # Navbar, Sidebar, StatsHeader
│   │   ├── upload/                      # Dropzone, ParseSummaryCard, BankTable
│   │   ├── generator/                   # ChapterTreeSelector, ExamConfigForm
│   │   ├── exam/                        # QuestionCard, OptionButton, ReasonBanner, QuestionPalette, ExamTimer
│   │   └── results/                     # ScoreHero, SectionBreakdownTable, ReviewQuestionList
│   ├── data/
│   │   └── nec-asoe-syllabus.ts         # Complete 10-chapter, 60-section official syllabus registry
│   ├── lib/
│   │   ├── db.ts                        # IndexedDB wrapper (questionBank, examSessions, uploadedFiles)
│   │   ├── excel-parser.ts              # SheetJS multi-tab & fallback MCQ extractor
│   │   ├── exam-generator.ts            # Chapter/section filtering, shuffling & session builder
│   │   └── scoring.ts                   # Accuracy, pass/fail, chapter/section analytics calculator
│   └── types/
│       └── mcq.ts                       # Core TypeScript interfaces & strict state types
├── Dockerfile                           # Multi-stage production container
├── docker-compose.yml                   # One-command container orchestration
├── .dockerignore
├── next.config.ts                       # Configured with output: 'standalone'
├── package.json
└── tsconfig.json
```

---

## 3. Core TypeScript Domain Models (`src/types/mcq.ts`)

```typescript
export type OptionKey = 'A' | 'B' | 'C' | 'D';

export interface SyllabusSection {
  sectionId: string;        // e.g., "1.1", "2.4", "10.6"
  syllabusCode: string;     // e.g., "ASoE0101", "ACtE0804", "AALL1006"
  chapterNumber: number;    // 1 .. 10
  title: string;            // e.g., "Introduction to Information Technology"
  topics: string;           // Full topic description from NEC PDF
}

export interface SyllabusChapter {
  chapterNumber: number;    // 1 .. 10
  chapterCode: string;      // e.g., "ASoE01", "ACtE08", ..., "AALL10"
  title: string;            // e.g., "Fundamentals of Information Technology"
  category: 'Fundamentals & Principles' | 'Engineering Practice' | 'Project Planning & Management';
  sections: SyllabusSection[];
}

export interface MCQQuestion {
  id: string;               // Deterministic hash or UUID: `${sectionId}-${questionHash}`
  sourceFile: string;       // e.g., "NEC_ASoE_Ch1_Fundamentals_of_IT_180_MCQs.xlsx"
  chapterNumber: number;    // 1 .. 10 (or 0 if uncategorized)
  sectionId: string;        // "1.1" .. "10.6"
  syllabusCode: string;     // "ASoE0101" .. "AALL1006"
  originalNo: number;       // Row "No" from sheet (1..30)
  question: string;
  options: Record<OptionKey, string>;
  correctOption: OptionKey;
  reason: string;           // Valid explanation shown after option lock
  importedAt: string;       // ISO timestamp
}

export interface LockedAnswerRecord {
  questionId: string;
  selectedOption: OptionKey; // Permanently locked once chosen
  isCorrect: boolean;
  lockedAt: string;          // ISO timestamp — enforces immutability
  timeSpentMs?: number;
}

export interface ExamSession {
  id: string;
  title: string;
  createdAt: string;
  completedAt?: string;
  status: 'in_progress' | 'completed';
  config: {
    selectedChapters: number[];
    selectedSections: string[];
    totalQuestions: number;
    shuffleQuestions: boolean;
    timeLimitMinutes: number | null; // null = untimed practice exam
  };
  questionIds: string[];
  questionsSnapshot: MCQQuestion[];  // Snapshot so exam remains intact even if bank changes
  answers: Record<string, LockedAnswerRecord>; // Keyed by questionId; write-once only!
  elapsedSeconds: number;
}
```

---

## 4. Implementation Tasks

1. **Scaffold Next.js Application**:
   - Initialize Next.js with TypeScript, Tailwind CSS, ESLint, App Router (`src/` directory).
   - Install runtime packages: `xlsx`, `idb`, `lucide-react`, `clsx`, `tailwind-merge`.
2. **Build Official Syllabus Registry (`src/data/nec-asoe-syllabus.ts`)**:
   - Populate all 10 chapters (`ASoE01` to `AALL10`) and all 60 sections (`1.1` to `10.6`) verbatim from [`00-SYLLABUS-AND-EXCEL-SPEC.md`](./00-SYLLABUS-AND-EXCEL-SPEC.md).
   - Export lookup helpers: `getChapterByNumber(n)`, `getSectionById(id)`, `resolveSyllabusFromText(sheetName, bannerText, fileName)`.
3. **Build IndexedDB Storage Layer (`src/lib/db.ts`)**:
   - Object stores:
     - `questions` (keyPath `id`, indexes on `chapterNumber`, `sectionId`, `sourceFile`).
     - `uploads` (metadata per uploaded `.xlsx` workbook: filename, upload timestamp, total questions, chapters covered).
     - `sessions` (active and completed `ExamSession` records).
   - Helper methods: `upsertQuestions()`, `getQuestionsByFilter()`, `getSyllabusCounts()`, `createExamSession()`, `lockQuestionAnswer()`, `completeExamSession()`.
4. **Build Application Shell & Dashboard (`src/app/layout.tsx`, `src/app/page.tsx`)**:
   - Responsive top navigation: **Dashboard**, **Upload Excel**, **Question Generator**, **Syllabus (`ASoE`)**, **Results History**.
   - Dashboard overview showing total uploaded questions across Chapters 1–10, syllabus progress bars, recent exam scores, and quick-launch buttons.

---

## 5. Acceptance Criteria (Definition of Done)
- [ ] `npm run build` and `npm run dev` succeed cleanly with zero TypeScript errors.
- [ ] All 10 NEC chapters and 60 sub-sections render accurately in the Syllabus Explorer with official codes (`ASoE0101`–`AALL1006`).
- [ ] IndexedDB layer persists and retrieves questions and sessions across browser refreshes.

