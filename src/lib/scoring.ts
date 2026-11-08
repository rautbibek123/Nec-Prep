import { getChapterByNumber, getSectionById } from '@/data/nec-asoe-syllabus';
import {
  ChapterScoreSummary,
  ExamResultSummary,
  ExamSession,
  SectionScoreSummary,
} from '@/types/mcq';

export const NEC_PASS_THRESHOLD_PERCENT = 50;

export function calculateExamSummary(session: ExamSession): ExamResultSummary {
  const totalQuestions = session.questionsSnapshot.length;
  let attempted = 0;
  let correct = 0;
  let wrong = 0;

  const sectionAcc = new Map<
    string,
    {
      sectionId: string;
      syllabusCode: string;
      chapterNumber: number;
      sectionTitle: string;
      total: number;
      attempted: number;
      correct: number;
      wrong: number;
    }
  >();

  for (const q of session.questionsSnapshot) {
    const ans = session.answers[q.id];
    const secMeta = getSectionById(q.sectionId);
    const entry = sectionAcc.get(q.sectionId) ?? {
      sectionId: q.sectionId,
      syllabusCode: secMeta?.syllabusCode ?? q.syllabusCode,
      chapterNumber: secMeta?.chapterNumber ?? q.chapterNumber,
      sectionTitle: secMeta?.title ?? q.sectionTitle,
      total: 0,
      attempted: 0,
      correct: 0,
      wrong: 0,
    };

    entry.total += 1;

    if (ans) {
      attempted += 1;
      entry.attempted += 1;
      if (ans.isCorrect) {
        correct += 1;
        entry.correct += 1;
      } else {
        wrong += 1;
        entry.wrong += 1;
      }
    }

    sectionAcc.set(q.sectionId, entry);
  }

  const skipped = Math.max(0, totalQuestions - attempted);
  const overallPercent =
    totalQuestions > 0 ? Math.round((correct / totalQuestions) * 1000) / 10 : 0;
  const attemptAccuracyPercent =
    attempted > 0 ? Math.round((correct / attempted) * 1000) / 10 : 0;

  const sectionBreakdown: SectionScoreSummary[] = Array.from(sectionAcc.values())
    .sort((a, b) => a.sectionId.localeCompare(b.sectionId, undefined, { numeric: true }))
    .map((s) => {
      const sSkipped = Math.max(0, s.total - s.attempted);
      const scorePercent = s.total > 0 ? Math.round((s.correct / s.total) * 1000) / 10 : 0;
      const accuracyPercent =
        s.attempted > 0 ? Math.round((s.correct / s.attempted) * 1000) / 10 : 0;

      let status: SectionScoreSummary['status'] = 'Unattempted';
      if (s.attempted > 0) {
        if (scorePercent >= 80) status = 'Strong';
        else if (scorePercent >= NEC_PASS_THRESHOLD_PERCENT) status = 'Good';
        else status = 'Needs Focus';
      }

      return {
        sectionId: s.sectionId,
        syllabusCode: s.syllabusCode,
        chapterNumber: s.chapterNumber,
        sectionTitle: s.sectionTitle,
        totalQuestions: s.total,
        attempted: s.attempted,
        correct: s.correct,
        wrong: s.wrong,
        skipped: sSkipped,
        scorePercent,
        accuracyPercent,
        status,
      };
    });

  const chapterMap = new Map<number, ChapterScoreSummary>();
  for (const sec of sectionBreakdown) {
    const chMeta = getChapterByNumber(sec.chapterNumber);
    const existing = chapterMap.get(sec.chapterNumber) ?? {
      chapterNumber: sec.chapterNumber,
      chapterCode: chMeta?.chapterCode ?? `Ch${sec.chapterNumber}`,
      chapterTitle: chMeta?.title ?? `Chapter ${sec.chapterNumber}`,
      totalQuestions: 0,
      attempted: 0,
      correct: 0,
      wrong: 0,
      skipped: 0,
      scorePercent: 0,
    };

    existing.totalQuestions += sec.totalQuestions;
    existing.attempted += sec.attempted;
    existing.correct += sec.correct;
    existing.wrong += sec.wrong;
    existing.skipped += sec.skipped;
    existing.scorePercent =
      existing.totalQuestions > 0
        ? Math.round((existing.correct / existing.totalQuestions) * 1000) / 10
        : 0;

    chapterMap.set(sec.chapterNumber, existing);
  }

  const chapterBreakdown = Array.from(chapterMap.values()).sort(
    (a, b) => a.chapterNumber - b.chapterNumber
  );

  const weakSections = sectionBreakdown.filter(
    (s) => s.status === 'Needs Focus' || s.status === 'Unattempted'
  );

  const avgSecondsPerAttempt =
    attempted > 0 ? Math.round((session.elapsedSeconds / attempted) * 10) / 10 : 0;

  return {
    sessionId: session.id,
    title: session.title,
    completedAt: session.completedAt,
    totalQuestions,
    attempted,
    correct,
    wrong,
    skipped,
    overallPercent,
    attemptAccuracyPercent,
    passed: overallPercent >= NEC_PASS_THRESHOLD_PERCENT,
    passThresholdPercent: NEC_PASS_THRESHOLD_PERCENT,
    elapsedSeconds: session.elapsedSeconds,
    avgSecondsPerAttempt,
    sectionBreakdown,
    chapterBreakdown,
    weakSections,
  };
}

export function formatDuration(totalSeconds: number): string {
  const sec = Math.max(0, Math.floor(totalSeconds));
  const hrs = Math.floor(sec / 3600);
  const mins = Math.floor((sec % 3600) / 60);
  const rem = sec % 60;

  if (hrs > 0) {
    return `${hrs}h ${String(mins).padStart(2, '0')}m ${String(rem).padStart(2, '0')}s`;
  }
  return `${mins}m ${String(rem).padStart(2, '0')}s`;
}

