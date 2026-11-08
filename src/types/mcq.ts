export type OptionKey = 'A' | 'B' | 'C' | 'D';

export const OPTION_KEYS: OptionKey[] = ['A', 'B', 'C', 'D'];

export type SyllabusCategory =
  | 'Fundamentals & Principles'
  | 'Engineering Practice'
  | 'Project Planning & Management';

export interface SyllabusSection {
  sectionId: string;        // e.g. "1.1" .. "10.6"
  syllabusCode: string;     // e.g. "ASoE0101" .. "AALL1006"
  chapterNumber: number;    // 1 .. 10
  title: string;
  topics: string;
}

export interface SyllabusChapter {
  chapterNumber: number;    // 1 .. 10
  chapterCode: string;      // e.g. "ASoE01", "ACtE08", "AALL10"
  title: string;
  category: SyllabusCategory;
  sections: SyllabusSection[];
}

export interface MCQQuestion {
  id: string;               // Deterministic unique ID: `${sectionId}::${hash}`
  sourceFile: string;       // Uploaded Excel filename
  chapterNumber: number;    // 1 .. 10 (0 = Custom / Uncategorized)
  sectionId: string;        // "1.1" .. "10.6" (or "custom")
  syllabusCode: string;     // "ASoE0101" .. "AALL1006"
  sectionTitle: string;
  originalNo: number;
  question: string;
  options: Record<OptionKey, string>;
  correctOption: OptionKey;
  reason: string;
  importedAt: string;
}

export interface UploadedWorkbookMeta {
  fileName: string;
  workbookTitle: string;
  uploadedAt: string;
  totalQuestions: number;
  chaptersCovered: number[];
  sectionsCovered: string[];
  sheetSummaries: {
    sheetName: string;
    sectionId: string;
    extractedCount: number;
    skippedCount: number;
  }[];
  warnings: string[];
}

export interface ParseWorkbookResult {
  meta: UploadedWorkbookMeta;
  questions: MCQQuestion[];
}

export interface LockedAnswerRecord {
  questionId: string;
  selectedOption: OptionKey;
  isCorrect: boolean;
  lockedAt: string;
}

export type QuestionPoolFilter = 'all' | 'unattempted' | 'wrong_previously';

export interface ExamConfig {
  selectedChapters: number[];
  selectedSections: string[];
  totalQuestions: number;
  shuffleQuestions: boolean;
  balancedAcrossSections: boolean;
  poolFilter: QuestionPoolFilter;
  timeLimitMinutes: number | null; // null = untimed mode
}

export interface ExamSession {
  id: string;
  title: string;
  createdAt: string;
  completedAt?: string;
  status: 'in_progress' | 'completed';
  config: ExamConfig;
  questionsSnapshot: MCQQuestion[];
  /**
   * Keyed by questionId. Once an entry is written, it is strictly immutable
   * (single-choice permanent lock).
   */
  answers: Record<string, LockedAnswerRecord>;
  currentIndex: number;
  elapsedSeconds: number;
}

export interface SectionScoreSummary {
  sectionId: string;
  syllabusCode: string;
  chapterNumber: number;
  sectionTitle: string;
  totalQuestions: number;
  attempted: number;
  correct: number;
  wrong: number;
  skipped: number;
  scorePercent: number;
  accuracyPercent: number;
  status: 'Strong' | 'Good' | 'Needs Focus' | 'Unattempted';
}

export interface ChapterScoreSummary {
  chapterNumber: number;
  chapterCode: string;
  chapterTitle: string;
  totalQuestions: number;
  attempted: number;
  correct: number;
  wrong: number;
  skipped: number;
  scorePercent: number;
}

export interface ExamResultSummary {
  sessionId: string;
  title: string;
  completedAt?: string;
  totalQuestions: number;
  attempted: number;
  correct: number;
  wrong: number;
  skipped: number;
  overallPercent: number;
  attemptAccuracyPercent: number;
  passed: boolean; // NEC Registration Exam standard: >= 50%
  passThresholdPercent: number;
  elapsedSeconds: number;
  avgSecondsPerAttempt: number;
  sectionBreakdown: SectionScoreSummary[];
  chapterBreakdown: ChapterScoreSummary[];
  weakSections: SectionScoreSummary[];
}

