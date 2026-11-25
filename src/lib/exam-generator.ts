import {
  ExamConfig,
  ExamMode,
  ExamSession,
  MCQQuestion,
  OPTION_KEYS,
  OptionKey,
  QuestionStatRecord,
} from '@/types/mcq';

/**
 * Unbiased Fisher-Yates array shuffle (returns a new array).
 */
export function fisherYatesShuffle<T>(items: readonly T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Shuffles the 4 options (A-D) of a question while updating `correctOption` to match.
 */
export function shuffleQuestionOptions(q: MCQQuestion): MCQQuestion {
  const entries = OPTION_KEYS.map((key) => ({
    text: q.options[key],
    isCorrect: key === q.correctOption,
  }));
  const shuffled = fisherYatesShuffle(entries);
  const nextOptions = {
    A: shuffled[0].text,
    B: shuffled[1].text,
    C: shuffled[2].text,
    D: shuffled[3].text,
  };
  const nextCorrectIndex = shuffled.findIndex((e) => e.isCorrect);
  const nextCorrect: OptionKey = OPTION_KEYS[nextCorrectIndex >= 0 ? nextCorrectIndex : 0];
  return {
    ...q,
    options: nextOptions,
    correctOption: nextCorrect,
  };
}

export function computeHistoricalQuestionStats(sessions: ExamSession[]): {
  attemptedIds: Set<string>;
  wrongLatestIds: Set<string>;
} {
  const attemptedIds = new Set<string>();
  const chronological = [...sessions].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const latestOutcome = new Map<string, boolean>();

  for (const s of chronological) {
    for (const [qId, ans] of Object.entries(s.answers)) {
      attemptedIds.add(qId);
      latestOutcome.set(qId, ans.isCorrect);
    }
  }

  const wrongLatestIds = new Set<string>();
  for (const [qId, isCorrect] of latestOutcome.entries()) {
    if (!isCorrect) {
      wrongLatestIds.add(qId);
    }
  }

  return { attemptedIds, wrongLatestIds };
}

export function filterPoolByConfig(
  allQuestions: MCQQuestion[],
  statsMap: Map<string, QuestionStatRecord>,
  config: Pick<ExamConfig, 'selectedSections' | 'poolFilter'>
): MCQQuestion[] {
  const allowedSections = new Set(config.selectedSections);
  const inScope = allQuestions.filter((q) => allowedSections.has(q.sectionId));

  if (config.poolFilter === 'all') {
    return inScope;
  }

  if (config.poolFilter === 'unattempted') {
    return inScope.filter((q) => (statsMap.get(q.id)?.attempts ?? 0) === 0);
  }

  if (config.poolFilter === 'wrong_previously') {
    return inScope.filter((q) => statsMap.get(q.id)?.lastIsCorrect === false);
  }

  if (config.poolFilter === 'bookmarked') {
    return inScope.filter((q) => Boolean(statsMap.get(q.id)?.bookmarked));
  }

  return inScope;
}

function createSessionId(prefix: string): string {
  return typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Builds an ExamSession with optional stratified balancing across selected syllabus sections.
 */
export function buildExamSession(params: {
  userId: string;
  title: string;
  pool: MCQQuestion[];
  config: ExamConfig;
  mode?: ExamMode;
}): ExamSession {
  const { userId, title, pool, config } = params;
  const mode: ExamMode = params.mode ?? config.mode ?? 'practice';
  const targetCount = Math.max(1, Math.min(config.totalQuestions, pool.length));

  let chosen: MCQQuestion[] = [];

  if (!config.shuffleQuestions) {
    const sorted = [...pool].sort((a, b) => {
      const secCmp = a.sectionId.localeCompare(b.sectionId, undefined, { numeric: true });
      if (secCmp !== 0) return secCmp;
      return a.originalNo - b.originalNo;
    });
    chosen = sorted.slice(0, targetCount);
  } else if (config.balancedAcrossSections) {
    const buckets = new Map<string, MCQQuestion[]>();
    for (const q of pool) {
      const list = buckets.get(q.sectionId) ?? [];
      list.push(q);
      buckets.set(q.sectionId, list);
    }

    const sectionKeys = fisherYatesShuffle(Array.from(buckets.keys()));
    const shuffledBuckets = new Map<string, MCQQuestion[]>();
    for (const key of sectionKeys) {
      shuffledBuckets.set(key, fisherYatesShuffle(buckets.get(key)!));
    }

    let pointer = 0;
    while (chosen.length < targetCount) {
      let addedInRound = false;
      for (const key of sectionKeys) {
        if (chosen.length >= targetCount) break;
        const bucket = shuffledBuckets.get(key)!;
        if (pointer < bucket.length) {
          chosen.push(bucket[pointer]);
          addedInRound = true;
        }
      }
      if (!addedInRound) break;
      pointer++;
    }

    chosen = fisherYatesShuffle(chosen);
  } else {
    chosen = fisherYatesShuffle(pool).slice(0, targetCount);
  }

  if (config.shuffleOptions) {
    chosen = chosen.map(shuffleQuestionOptions);
  }

  return {
    id: createSessionId('exam'),
    userId,
    title: title.trim() || 'NEC ASoE Practice Exam',
    createdAt: new Date().toISOString(),
    status: 'in_progress',
    mode,
    config: {
      ...config,
      mode,
      totalQuestions: chosen.length,
    },
    questionsSnapshot: chosen,
    answers: {},
    flaggedIds: [],
    currentIndex: 0,
    elapsedSeconds: 0,
  };
}

/**
 * Creates a targeted Remediation ExamSession from a specific subset of questions (e.g. Wrong/Skipped).
 */
export function buildRemediationSession(params: {
  userId: string;
  title: string;
  questions: MCQQuestion[];
  mode?: ExamMode;
  timeLimitMinutes?: number | null;
  shuffleOptions?: boolean;
}): ExamSession {
  let shuffled = fisherYatesShuffle(params.questions);
  if (params.shuffleOptions) {
    shuffled = shuffled.map(shuffleQuestionOptions);
  }
  const chapters = Array.from(new Set(shuffled.map((q) => q.chapterNumber))).sort((a, b) => a - b);
  const sections = Array.from(new Set(shuffled.map((q) => q.sectionId))).sort((a, b) =>
    a.localeCompare(b, undefined, { numeric: true })
  );
  const mode: ExamMode = params.mode ?? 'practice';

  return {
    id: createSessionId('retry'),
    userId: params.userId,
    title: params.title,
    createdAt: new Date().toISOString(),
    status: 'in_progress',
    mode,
    config: {
      selectedChapters: chapters,
      selectedSections: sections,
      totalQuestions: shuffled.length,
      shuffleQuestions: true,
      balancedAcrossSections: false,
      poolFilter: 'all',
      timeLimitMinutes: params.timeLimitMinutes ?? null,
      mode,
      shuffleOptions: Boolean(params.shuffleOptions),
    },
    questionsSnapshot: shuffled,
    answers: {},
    flaggedIds: [],
    currentIndex: 0,
    elapsedSeconds: 0,
  };
}
