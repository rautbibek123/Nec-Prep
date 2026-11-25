export type OptionKey = 'A' | 'B' | 'C' | 'D';

export const OPTION_KEYS: OptionKey[] = ['A', 'B', 'C', 'D'];

export type SyllabusCategory =
  | 'Fundamentals & Principles'
  | 'Engineering Practice'
  | 'Project Planning & Management';

export type ExamMode = 'practice' | 'exam';

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
  id: string;               // Deterministic unique ID: `${sectionId}::${hash(stem+options)}`
  sourceFile: string;       // Excel filename
  chapterNumber: number;    // 1 .. 10 (0 = Custom / Uncategorized)
  sectionId: string;        // "1.1" .. "10.6" (or "custom")
  syllabusCode: string;     // "ASoE0101" .. "AALL1006"
  sectionTitle: string;
  originalNo: number;
  question: string;
  options: Record<OptionKey, string>;
  correctOption: OptionKey;
  reason: string;
  contextNote?: string;     // Scenario context for follow-up questions ("For the same ...")
  origin?: 'seeded' | 'uploaded';
  importedAt: string;
}

export interface UploadedWorkbookMeta {
  fileName: string;
  workbookTitle: string;
  uploadedAt: string;
  totalQuestions: number;
  chaptersCovered: number[];
  sectionsCovered: string[];
  origin?: 'seeded' | 'uploaded';
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

export type QuestionPoolFilter =
  | 'all'
  | 'unattempted'
  | 'wrong_previously'
  | 'bookmarked';

export interface ExamConfig {
  selectedChapters: number[];
  selectedSections: string[];
  totalQuestions: number;
  shuffleQuestions: boolean;
  balancedAcrossSections: boolean;
  poolFilter: QuestionPoolFilter;
  timeLimitMinutes: number | null; // null = untimed mode
  mode?: ExamMode;
  shuffleOptions?: boolean;
  setId?: string;
  setNumber?: number;
}

export interface ExamSession {
  id: string;
  userId: string;
  title: string;
  createdAt: string;
  completedAt?: string;
  status: 'in_progress' | 'completed';
  mode: ExamMode;
  setId?: string;
  setNumber?: number;
  config: ExamConfig;
  questionsSnapshot: MCQQuestion[];
  /**
   * Keyed by questionId.
   * In 'practice' mode, once an entry is written, it is strictly immutable (single-choice permanent lock).
   * In 'exam' mode, choices may be changed until final submission.
   */
  answers: Record<string, LockedAnswerRecord>;
  flaggedIds?: string[];
  currentIndex: number;
  elapsedSeconds: number;
}

export interface TestSetDefinition {
  id: string;                 // e.g. "set-01" .. "set-30", "practice-01" .. "practice-20"
  setNumber: number;          // 1 .. 30 (mock) or 1 .. 20 (practice)
  title: string;
  tier: 'core' | 'extended' | 'practice';
  defaultMode?: ExamMode;
  timeLimitMinutes: number | null; // 120 for mock sets, null for untimed practice sets
  questionCount: number;      // 100 (mock) or 50 (practice)
  questionIds: string[];      // Unique MCQ IDs
  chapterDistribution: Record<number, number>; // 1..10 => 10 (mock) or 5 (practice)
  sectionDistribution: Record<string, number>; // 1.1..10.6
}

export interface QuestionStatRecord {
  key: string;                // `${userId}::${questionId}`
  userId: string;
  questionId: string;
  sectionId: string;
  chapterNumber: number;
  attempts: number;
  correctCount: number;
  wrongCount: number;
  lastIsCorrect: boolean | null;
  lastAttemptedAt: string | null;
  bookmarked: boolean;
}

export interface SeedManifest {
  version: string;
  generatedAt: string;
  totalQuestions: number;
  totalSets: number;
  mockSetsCount?: number;
  practiceSetsCount?: number;
  chaptersCount: number;
  sectionsCount: number;
  workbooks: UploadedWorkbookMeta[];
}

export interface QuestionBankSummary {
  totalQuestions: number;
  seededQuestions: number;
  uploadedQuestions: number;
  chapterCounts: Record<number, number>;
  sectionCounts: Record<string, number>;
  populatedSectionsCount: number;
  workbooks: UploadedWorkbookMeta[];
  seedVersion: string | null;
}

export interface AppUser {
  id: string;                 // 'guest' | `local:${slug}` | `google:${sub}`
  name: string;
  email?: string;
  image?: string;
  provider: 'google' | 'local';
}

export interface UserBackupPayload {
  version: 1;
  exportedAt: string;
  userId: string;
  userName: string;
  sessions: ExamSession[];
  questionStats: QuestionStatRecord[];
  uploadedWorkbooks: UploadedWorkbookMeta[];
  uploadedQuestions: MCQQuestion[];
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
