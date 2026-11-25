import { ALL_SYLLABUS_SECTIONS, NEC_ASOE_SYLLABUS } from '@/data/nec-asoe-syllabus';
import { fisherYatesShuffle, shuffleQuestionOptions } from '@/lib/exam-generator';
import {
  ExamMode,
  ExamSession,
  MCQQuestion,
  QuestionStatRecord,
  TestSetDefinition,
} from '@/types/mcq';

function createId(prefix: string): string {
  return typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Starts a balanced ExamSession from a pre-compiled Mock or Practice Test Set.
 */
export function buildSessionFromTestSet(params: {
  testSet: TestSetDefinition;
  questions: MCQQuestion[];
  userId: string;
  mode: ExamMode;
  shuffleQuestions?: boolean;
  shuffleOptions?: boolean;
}): ExamSession {
  const { testSet, questions, userId, mode, shuffleQuestions = true, shuffleOptions = false } =
    params;

  const byId = new Map(questions.map((q) => [q.id, q]));
  let ordered: MCQQuestion[] = testSet.questionIds
    .map((id) => byId.get(id))
    .filter((q): q is MCQQuestion => Boolean(q));

  if (shuffleQuestions) {
    ordered = fisherYatesShuffle(ordered);
  }
  if (shuffleOptions) {
    ordered = ordered.map(shuffleQuestionOptions);
  }

  const modeLabel =
    testSet.tier === 'practice'
      ? 'Instant Lock Practice'
      : mode === 'exam'
      ? 'Real NEC Exam'
      : 'Practice Mode';

  return {
    id: createId('set-exam'),
    userId,
    title: `${testSet.title} (${modeLabel})`,
    createdAt: new Date().toISOString(),
    status: 'in_progress',
    mode,
    setId: testSet.id,
    setNumber: testSet.setNumber,
    config: {
      selectedChapters: NEC_ASOE_SYLLABUS.map((c) => c.chapterNumber),
      selectedSections: ALL_SYLLABUS_SECTIONS.map((s) => s.sectionId),
      totalQuestions: ordered.length,
      shuffleQuestions,
      balancedAcrossSections: true,
      poolFilter: 'all',
      timeLimitMinutes: testSet.timeLimitMinutes ?? null,
      mode,
      shuffleOptions,
      setId: testSet.id,
      setNumber: testSet.setNumber,
    },
    questionsSnapshot: ordered,
    answers: {},
    flaggedIds: [],
    currentIndex: 0,
    elapsedSeconds: 0,
  };
}

/**
 * Dynamically builds a fresh 100-question / 2-hour exam strictly balanced across
 * all 10 chapters (exactly 10 Qs/chapter) and all 60 sections (1-2 Qs/section),
 * with 0 duplicates, prioritizing unseen or previously wrong questions first.
 */
export function buildDynamicBalanced100Set(params: {
  allQuestions: MCQQuestion[];
  statsMap: Map<string, QuestionStatRecord>;
  userId: string;
  mode: ExamMode;
  prioritize: 'unseen' | 'weak';
  shuffleOptions?: boolean;
}): ExamSession {
  const { allQuestions, statsMap, userId, mode, prioritize, shuffleOptions = false } = params;

  const bySection = new Map<string, MCQQuestion[]>();
  for (const s of ALL_SYLLABUS_SECTIONS) {
    bySection.set(s.sectionId, []);
  }
  for (const q of allQuestions) {
    const arr = bySection.get(q.sectionId);
    if (arr) arr.push(q);
  }

  const rankBucket = (items: MCQQuestion[]): MCQQuestion[] => {
    const shuffled = fisherYatesShuffle(items);
    if (prioritize === 'unseen') {
      const unseen = shuffled.filter((q) => (statsMap.get(q.id)?.attempts ?? 0) === 0);
      const seen = shuffled.filter((q) => (statsMap.get(q.id)?.attempts ?? 0) > 0);
      return [...unseen, ...seen];
    }
    const wrong = shuffled.filter((q) => statsMap.get(q.id)?.lastIsCorrect === false);
    const unseen = shuffled.filter((q) => (statsMap.get(q.id)?.attempts ?? 0) === 0);
    const mastered = shuffled.filter((q) => statsMap.get(q.id)?.lastIsCorrect === true);
    return [...wrong, ...unseen, ...mastered];
  };

  const chosen: MCQQuestion[] = [];
  const usedIds = new Set<string>();

  for (const ch of NEC_ASOE_SYLLABUS) {
    // Pick 4 sections to give 2 Qs and 2 sections to give 1 Q at random
    const secOrder = fisherYatesShuffle(ch.sections);
    const quotas = new Map<string, number>();
    secOrder.forEach((sec, idx) => {
      quotas.set(sec.sectionId, idx < 4 ? 2 : 1);
    });

    const chChosen: MCQQuestion[] = [];
    for (const sec of ch.sections) {
      const target = quotas.get(sec.sectionId) ?? 1;
      const ranked = rankBucket(bySection.get(sec.sectionId) ?? []);
      let taken = 0;
      for (const q of ranked) {
        if (taken >= target) break;
        if (!usedIds.has(q.id)) {
          usedIds.add(q.id);
          chChosen.push(q);
          taken++;
        }
      }
    }

    // Fallback inside same chapter if any section had fewer questions than target
    if (chChosen.length < 10) {
      const chAll = rankBucket(
        ch.sections.flatMap((s) => bySection.get(s.sectionId) ?? [])
      );
      for (const q of chAll) {
        if (chChosen.length >= 10) break;
        if (!usedIds.has(q.id)) {
          usedIds.add(q.id);
          chChosen.push(q);
        }
      }
    }

    chosen.push(...chChosen);
  }

  let finalQuestions = fisherYatesShuffle(chosen);
  if (shuffleOptions) {
    finalQuestions = finalQuestions.map(shuffleQuestionOptions);
  }

  const label =
    prioritize === 'unseen' ? 'Smart Unseen Balanced 100' : 'Weak-Area Balanced 100';

  return {
    id: createId('dyn-set'),
    userId,
    title: `${label} (${mode === 'exam' ? 'Real NEC Exam' : 'Practice Mode'})`,
    createdAt: new Date().toISOString(),
    status: 'in_progress',
    mode,
    config: {
      selectedChapters: NEC_ASOE_SYLLABUS.map((c) => c.chapterNumber),
      selectedSections: ALL_SYLLABUS_SECTIONS.map((s) => s.sectionId),
      totalQuestions: finalQuestions.length,
      shuffleQuestions: true,
      balancedAcrossSections: true,
      poolFilter: prioritize === 'unseen' ? 'unattempted' : 'wrong_previously',
      timeLimitMinutes: 120,
      mode,
      shuffleOptions,
    },
    questionsSnapshot: finalQuestions,
    answers: {},
    flaggedIds: [],
    currentIndex: 0,
    elapsedSeconds: 0,
  };
}
