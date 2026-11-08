'use client';

import { type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock,
  Flag,
  Lightbulb,
  Lock,
  SkipForward,
  XCircle,
} from 'lucide-react';
import {
  completeSessionInDb,
  getSessionById,
  lockSessionAnswer,
  updateSessionProgress,
} from '@/lib/db';
import { formatDuration } from '@/lib/scoring';
import { ExamSession, LockedAnswerRecord, OPTION_KEYS, OptionKey } from '@/types/mcq';

export default function InteractiveExamPage() {
  const params = useParams<{ sessionId: string }>();
  const sessionId = params.sessionId;
  const router = useRouter();

  const [session, setSession] = useState<ExamSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const elapsedRef = useRef(0);
  elapsedRef.current = elapsedSeconds;

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const loaded = await getSessionById(sessionId);
        if (!active) return;
        if (!loaded) {
          setLoading(false);
          return;
        }
        if (loaded.status === 'completed') {
          router.replace(`/results/${loaded.id}`);
          return;
        }
        setSession(loaded);
        setCurrentIndex(loaded.currentIndex ?? 0);
        setElapsedSeconds(loaded.elapsedSeconds ?? 0);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [sessionId, router]);

  const finalizeExam = useCallback(async () => {
    if (!session || submitting) return;
    setSubmitting(true);
    try {
      await completeSessionInDb(session.id, elapsedRef.current);
      router.push(`/results/${session.id}`);
    } finally {
      setSubmitting(false);
    }
  }, [session, submitting, router]);

  // Live 1-second timer + periodic IndexedDB checkpoint
  useEffect(() => {
    if (!session || session.status === 'completed') return;

    const timer = setInterval(() => {
      setElapsedSeconds((prev) => {
        const next = prev + 1;
        // Persist timer checkpoint every 5 seconds
        if (next % 5 === 0) {
          updateSessionProgress(session.id, { elapsedSeconds: next }).catch(() => {});
        }
        if (
          session.config.timeLimitMinutes !== null &&
          next >= session.config.timeLimitMinutes * 60
        ) {
          clearInterval(timer);
          finalizeExam();
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [session, finalizeExam]);

  const totalQuestions = session?.questionsSnapshot.length ?? 0;
  const currentQuestion = session?.questionsSnapshot[currentIndex];
  const lockedRecord = currentQuestion ? session?.answers[currentQuestion.id] : undefined;
  const isLocked = Boolean(lockedRecord);

  /**
   * STRICT SINGLE-CHOICE LOCK:
   * Once an option is selected for `currentQuestion.id`, it is written once and permanently locked.
   */
  const handleSelectOption = useCallback(
    async (optionKey: OptionKey) => {
      if (!session || !currentQuestion || submitting) return;
      // Layer 1 Guard: Never allow re-choosing an already answered question
      if (session.answers[currentQuestion.id]) return;

      const record: LockedAnswerRecord = {
        questionId: currentQuestion.id,
        selectedOption: optionKey,
        isCorrect: optionKey === currentQuestion.correctOption,
        lockedAt: new Date().toISOString(),
      };

      // Optimistic immediate UI lock
      setSession((prev) => {
        if (!prev || prev.answers[currentQuestion.id]) return prev;
        return {
          ...prev,
          answers: {
            ...prev.answers,
            [currentQuestion.id]: record,
          },
        };
      });

      // Layer 2 Atomic IndexedDB write-once lock
      const persisted = await lockSessionAnswer(
        session.id,
        currentQuestion.id,
        record,
        elapsedRef.current
      );
      if (persisted) {
        setSession(persisted);
      }
    },
    [session, currentQuestion, submitting]
  );

  const goToQuestion = useCallback(
    (idx: number) => {
      if (!session) return;
      const bounded = Math.max(0, Math.min(idx, session.questionsSnapshot.length - 1));
      setCurrentIndex(bounded);
      updateSessionProgress(session.id, {
        currentIndex: bounded,
        elapsedSeconds: elapsedRef.current,
      }).catch(() => {});
    },
    [session]
  );

  const goToNextUnanswered = useCallback(() => {
    if (!session) return;
    const len = session.questionsSnapshot.length;
    for (let offset = 1; offset <= len; offset++) {
      const candidateIdx = (currentIndex + offset) % len;
      const q = session.questionsSnapshot[candidateIdx];
      if (!session.answers[q.id]) {
        goToQuestion(candidateIdx);
        return;
      }
    }
  }, [session, currentIndex, goToQuestion]);

  // Keyboard shortcuts: A/B/C/D or 1/2/3/4 when unlocked, Left/Right arrows to navigate
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (showSubmitConfirm) return;
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      const keyUpper = e.key.toUpperCase();
      if (!isLocked) {
        if (keyUpper === 'A' || keyUpper === '1') {
          e.preventDefault();
          handleSelectOption('A');
          return;
        }
        if (keyUpper === 'B' || keyUpper === '2') {
          e.preventDefault();
          handleSelectOption('B');
          return;
        }
        if (keyUpper === 'C' || keyUpper === '3') {
          e.preventDefault();
          handleSelectOption('C');
          return;
        }
        if (keyUpper === 'D' || keyUpper === '4') {
          e.preventDefault();
          handleSelectOption('D');
          return;
        }
      }

      if (e.key === 'ArrowRight' && currentIndex < totalQuestions - 1) {
        e.preventDefault();
        goToQuestion(currentIndex + 1);
      } else if (e.key === 'ArrowLeft' && currentIndex > 0) {
        e.preventDefault();
        goToQuestion(currentIndex - 1);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [
    isLocked,
    handleSelectOption,
    currentIndex,
    totalQuestions,
    goToQuestion,
    showSubmitConfirm,
  ]);

  const liveStats = useMemo(() => {
    if (!session) return { answered: 0, correct: 0, wrong: 0, remaining: 0 };
    const records = Object.values(session.answers);
    const answered = records.length;
    const correct = records.filter((r) => r.isCorrect).length;
    const wrong = answered - correct;
    const remaining = Math.max(0, session.questionsSnapshot.length - answered);
    return { answered, correct, wrong, remaining };
  }, [session]);

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-16 text-center text-sm text-slate-500">
        Loading your locked exam session...
      </div>
    );
  }

  if (!session || !currentQuestion) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center space-y-4">
        <AlertCircle className="mx-auto h-10 w-10 text-rose-500" />
        <h1 className="text-xl font-bold text-slate-900">Exam Session Not Found</h1>
        <p className="text-sm text-slate-600">
          This exam session could not be found in your browser storage.
        </p>
        <Link
          href="/generator"
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white"
        >
          Create New Exam
        </Link>
      </div>
    );
  }

  const remainingSeconds =
    session.config.timeLimitMinutes !== null
      ? Math.max(0, session.config.timeLimitMinutes * 60 - elapsedSeconds)
      : null;

  const isLowTime = remainingSeconds !== null && remainingSeconds <= 120;
  const progressPercent = Math.round((liveStats.answered / totalQuestions) * 100);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 space-y-6">
      {/* Top Sticky Exam Status Header */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs space-y-3">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-base sm:text-lg font-bold text-slate-900">{session.title}</h1>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
              <span className="rounded-md bg-slate-100 px-2 py-0.5 font-semibold text-slate-700">
                Answered: {liveStats.answered} / {totalQuestions}
              </span>
              <span className="rounded-md bg-emerald-50 px-2 py-0.5 font-semibold text-emerald-700">
                Correct: {liveStats.correct}
              </span>
              <span className="rounded-md bg-rose-50 px-2 py-0.5 font-semibold text-rose-700">
                Wrong: {liveStats.wrong}
              </span>
              <span className="rounded-md bg-amber-50 px-2 py-0.5 font-semibold text-amber-800">
                Unanswered: {liveStats.remaining}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div
              className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold ring-1 ${
                remainingSeconds !== null
                  ? isLowTime
                    ? 'bg-rose-50 text-rose-700 ring-rose-300 animate-pulse'
                    : 'bg-slate-900 text-white ring-slate-800'
                  : 'bg-slate-100 text-slate-700 ring-slate-200'
              }`}
            >
              <Clock className="h-4 w-4" />
              {remainingSeconds !== null
                ? `Time Left: ${formatDuration(remainingSeconds)}`
                : `Elapsed: ${formatDuration(elapsedSeconds)}`}
            </div>

            <button
              type="button"
              onClick={() => {
                if (liveStats.remaining > 0) {
                  setShowSubmitConfirm(true);
                } else {
                  finalizeExam();
                }
              }}
              disabled={submitting}
              className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-xs transition hover:bg-indigo-700 disabled:opacity-60 cursor-pointer"
            >
              <Flag className="h-3.5 w-3.5" />
              {submitting ? 'Submitting...' : 'Finish & View Result'}
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-indigo-600 transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Main Workspace: Question Stage + Palette */}
      <div className="grid gap-6 lg:grid-cols-12 lg:items-start">
        {/* Question Card */}
        <div className="lg:col-span-8 space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-7 shadow-xs space-y-6">
            {/* Question Metadata Row */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-lg bg-indigo-600 px-2.5 py-1 text-xs font-bold text-white">
                  Question {currentIndex + 1} of {totalQuestions}
                </span>
                <span className="rounded-lg bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700">
                  Sec {currentQuestion.sectionId} • {currentQuestion.syllabusCode}
                </span>
                <span className="text-xs text-slate-500 hidden sm:inline">
                  {currentQuestion.sectionTitle}
                </span>
              </div>

              {isLocked ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white">
                  <Lock className="h-3 w-3" />
                  Option Locked ({lockedRecord?.selectedOption})
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-800 ring-1 ring-amber-200">
                  <Lock className="h-3 w-3" />
                  Select once — cannot change after click
                </span>
              )}
            </div>

            {/* Question Stem */}
            <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-relaxed">
              {currentQuestion.question}
            </h2>

            {/* Four Options (A, B, C, D) */}
            <div className="space-y-3" role="radiogroup" aria-label="Answer options">
              {OPTION_KEYS.map((key) => {
                const isSelected = lockedRecord?.selectedOption === key;
                const isActualCorrect = currentQuestion.correctOption === key;

                let cardClasses =
                  'border-slate-200 bg-white hover:border-indigo-400 hover:bg-indigo-50/40 cursor-pointer';
                let letterClasses = 'bg-slate-100 text-slate-700 group-hover:bg-indigo-600 group-hover:text-white';
                let badgeNode: ReactNode = null;

                if (isLocked) {
                  if (isSelected && lockedRecord?.isCorrect) {
                    // User chose RIGHT option
                    cardClasses =
                      'border-emerald-500 bg-emerald-50/90 ring-2 ring-emerald-500/20 cursor-not-allowed';
                    letterClasses = 'bg-emerald-600 text-white';
                    badgeNode = (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-2.5 py-0.5 text-xs font-bold text-white shrink-0">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Correct!
                      </span>
                    );
                  } else if (isSelected && !lockedRecord?.isCorrect) {
                    // User chose WRONG option -> Red
                    cardClasses =
                      'border-rose-500 bg-rose-50/90 ring-2 ring-rose-500/20 cursor-not-allowed';
                    letterClasses = 'bg-rose-600 text-white';
                    badgeNode = (
                      <span className="inline-flex items-center gap-1 rounded-full bg-rose-600 px-2.5 py-0.5 text-xs font-bold text-white shrink-0">
                        <XCircle className="h-3.5 w-3.5" />
                        Your Choice (Wrong)
                      </span>
                    );
                  } else if (!isSelected && isActualCorrect) {
                    // Reveal actual CORRECT option in Green when user picked wrong!
                    cardClasses =
                      'border-emerald-500 bg-emerald-50/90 ring-2 ring-emerald-500/20 cursor-not-allowed';
                    letterClasses = 'bg-emerald-600 text-white';
                    badgeNode = (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-2.5 py-0.5 text-xs font-bold text-white shrink-0">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Correct Option
                      </span>
                    );
                  } else {
                    // Unselected distractor after lock
                    cardClasses = 'border-slate-200 bg-slate-50/60 opacity-60 cursor-not-allowed';
                    letterClasses = 'bg-slate-200 text-slate-500';
                  }
                }

                return (
                  <button
                    key={key}
                    type="button"
                    disabled={isLocked}
                    aria-disabled={isLocked}
                    onClick={() => handleSelectOption(key)}
                    className={`group flex w-full items-center justify-between gap-3 rounded-xl border-2 p-4 text-left transition ${cardClasses}`}
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <span
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm font-bold transition ${letterClasses}`}
                      >
                        {key}
                      </span>
                      <span className="text-sm sm:text-base font-medium text-slate-900 break-words">
                        {currentQuestion.options[key]}
                      </span>
                    </div>
                    {badgeNode}
                  </button>
                );
              })}
            </div>

            {/* Instant Valid Reason / Explanation Reveal */}
            {isLocked && lockedRecord && (
              <div
                className={`rounded-2xl border-2 p-5 space-y-2 transition-all ${
                  lockedRecord.isCorrect
                    ? 'border-emerald-200 bg-emerald-50/70 text-emerald-950'
                    : 'border-amber-300 bg-amber-50/80 text-slate-900'
                }`}
              >
                <div className="flex items-center gap-2">
                  {lockedRecord.isCorrect ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                  ) : (
                    <Lightbulb className="h-5 w-5 text-amber-600 shrink-0" />
                  )}
                  <h3 className="text-sm font-bold">
                    {lockedRecord.isCorrect
                      ? `Spot On! Option ${currentQuestion.correctOption} is Correct.`
                      : `Incorrect Choice (${lockedRecord.selectedOption}) — The Correct Option is ${currentQuestion.correctOption}: "${
                          currentQuestion.options[currentQuestion.correctOption]
                        }"`}
                  </h3>
                </div>
                <p className="text-sm leading-relaxed pl-7 text-slate-800">
                  <strong className="font-semibold">Reason / Explanation: </strong>
                  {currentQuestion.reason}
                </p>
              </div>
            )}

            {/* Navigation Footer */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
              <button
                type="button"
                disabled={currentIndex === 0}
                onClick={() => goToQuestion(currentIndex - 1)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
              >
                <ArrowLeft className="h-4 w-4" />
                Previous
              </button>

              <div className="flex items-center gap-2">
                {liveStats.remaining > 0 && (
                  <button
                    type="button"
                    onClick={goToNextUnanswered}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50 px-3.5 py-2 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-100 cursor-pointer"
                  >
                    <SkipForward className="h-3.5 w-3.5" />
                    Next Unanswered
                  </button>
                )}

                {currentIndex < totalQuestions - 1 ? (
                  <button
                    type="button"
                    onClick={() => goToQuestion(currentIndex + 1)}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white transition hover:bg-slate-800 cursor-pointer"
                  >
                    Next Question
                    <ArrowRight className="h-4 w-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      if (liveStats.remaining > 0) setShowSubmitConfirm(true);
                      else finalizeExam();
                    }}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-indigo-700 cursor-pointer"
                  >
                    <Flag className="h-3.5 w-3.5" />
                    Submit Exam
                  </button>
                )}
              </div>
            </div>
          </div>

          <p className="text-xs text-slate-400 text-center">
            Keyboard shortcuts: Press <kbd className="rounded border px-1">A</kbd>–
            <kbd className="rounded border px-1">D</kbd> (or <kbd className="rounded border px-1">1</kbd>–
            <kbd className="rounded border px-1">4</kbd>) to lock an option •{' '}
            <kbd className="rounded border px-1">←</kbd> /{' '}
            <kbd className="rounded border px-1">→</kbd> to switch questions.
          </p>
        </div>

        {/* Right Sidebar: Question Navigator Palette */}
        <div className="lg:col-span-4 lg:sticky lg:top-20 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Question Palette</h3>
            <span className="text-xs text-slate-500">
              {liveStats.answered}/{totalQuestions} Locked
            </span>
          </div>

          <div className="grid grid-cols-6 sm:grid-cols-8 lg:grid-cols-5 xl:grid-cols-6 gap-2 max-h-80 overflow-y-auto pr-1">
            {session.questionsSnapshot.map((q, idx) => {
              const ans = session.answers[q.id];
              const isCurrent = idx === currentIndex;

              let tileClass = 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300';
              if (ans?.isCorrect) {
                tileClass = 'border-emerald-500 bg-emerald-500 text-white font-bold';
              } else if (ans && !ans.isCorrect) {
                tileClass = 'border-rose-500 bg-rose-500 text-white font-bold';
              }

              return (
                <button
                  key={q.id}
                  type="button"
                  onClick={() => goToQuestion(idx)}
                  className={`flex h-9 w-full items-center justify-center rounded-lg border text-xs transition cursor-pointer ${tileClass} ${
                    isCurrent ? 'ring-2 ring-indigo-600 ring-offset-2' : ''
                  }`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>

          {/* Palette Legend */}
          <div className="grid grid-cols-3 gap-2 border-t border-slate-100 pt-3 text-[11px] text-slate-600">
            <div className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded bg-emerald-500 inline-block" />
              Correct ({liveStats.correct})
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded bg-rose-500 inline-block" />
              Wrong ({liveStats.wrong})
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded border border-slate-300 bg-slate-50 inline-block" />
              Open ({liveStats.remaining})
            </div>
          </div>
        </div>
      </div>

      {/* Unanswered Confirmation Modal */}
      {showSubmitConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-3 text-amber-600">
              <AlertCircle className="h-6 w-6 shrink-0" />
              <h3 className="text-lg font-bold text-slate-900">Submit Exam Now?</h3>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">
              You still have{' '}
              <strong className="text-slate-900">{liveStats.remaining} unanswered question(s)</strong>{' '}
              out of {totalQuestions}. Unanswered questions will be marked as skipped in your final
              report.
            </p>
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowSubmitConfirm(false)}
                className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Keep Answering
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowSubmitConfirm(false);
                  finalizeExam();
                }}
                className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-700 cursor-pointer"
              >
                Submit &amp; Generate Result
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
