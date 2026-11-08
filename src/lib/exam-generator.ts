import { ExamConfig, ExamSession, MCQQuestion } from '@/types/mcq';

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

export function computeHistoricalQuestionStats(sessions: ExamSession[]): {
  attemptedIds: Set<string>;
  wrongLatestIds: Set<string>;
} {
  const attemptedIds = new Set<string>();
  // Sort oldest to newest so latest attempt wins
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
  pastSessions: ExamSession[],
  config: Pick<ExamConfig, 'selectedSections' | 'poolFilter'>
): MCQQuestion[] {
  const allowedSections = new Set(config.selectedSections);
  const inScope = allQuestions.filter((q) => allowedSections.has(q.sectionId));

  if (config.poolFilter === 'all') {
    return inScope;
  }

  const { attemptedIds, wrongLatestIds } = computeHistoricalQuestionStats(pastSessions);

  if (config.poolFilter === 'unattempted') {
    return inScope.filter((q) => !attemptedIds.has(q.id));
  }

  if (config.poolFilter === 'wrong_previously') {
    return inScope.filter((q) => wrongLatestIds.has(q.id));
  }

  return inScope;
}

/**
 * Builds an ExamSession with optional stratified balancing across selected syllabus sections.
 */
export function buildExamSession(params: {
  title: string;
  pool: MCQQuestion[];
  config: ExamConfig;
}): ExamSession {
  const { title, pool, config } = params;
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
    // Group by sectionId and sample round-robin across shuffled buckets
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

    // Final shuffle so questions from the same round aren't in predictable section cycle
    chosen = fisherYatesShuffle(chosen);
  } else {
    chosen = fisherYatesShuffle(pool).slice(0, targetCount);
  }

  const sessionId =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `exam-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

  return {
    id: sessionId,
    title: title.trim() || 'NEC ASoE Practice Exam',
    createdAt: new Date().toISOString(),
    status: 'in_progress',
    config: {
      ...config,
      totalQuestions: chosen.length,
    },
    questionsSnapshot: chosen,
    answers: {},
    currentIndex: 0,
    elapsedSeconds: 0,
  };
}

/**
 * Creates a targeted Remediation ExamSession from a specific subset of questions (e.g. Wrong/Skipped).
 */
export function buildRemediationSession(params: {
  title: string;
  questions: MCQQuestion[];
  timeLimitMinutes?: number | null;
}): ExamSession {
  const shuffled = fisherYatesShuffle(params.questions);
  const chapters = Array.from(new Set(shuffled.map((q) => q.chapterNumber))).sort((a, b) => a - b);
  const sections = Array.from(new Set(shuffled.map((q) => q.sectionId))).sort((a, b) =>
    a.localeCompare(b, undefined, { numeric: true })
  );

  const sessionId =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `retry-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

  return {
    id: sessionId,
    title: params.title,
    createdAt: new Date().toISOString(),
    status: 'in_progress',
    config: {
      selectedChapters: chapters,
      selectedSections: sections,
      totalQuestions: shuffled.length,
      shuffleQuestions: true,
      balancedAcrossSections: false,
      poolFilter: 'all',
      timeLimitMinutes: params.timeLimitMinutes ?? null,
    },
    questionsSnapshot: shuffled,
    answers: {},
    currentIndex: 0,
    elapsedSeconds: 0,
  };
}

