'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  Award,
  CheckCircle2,
  ClipboardList,
  Clock,
  Layers,
  Lock,
  Play,
  RotateCcw,
  ShieldCheck,
  Shuffle,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { useAppData } from '@/components/AppDataProvider';
import {
  createSession,
  getAllQuestions,
  getQuestionsByIds,
  getUserSessions,
  getUserStatsMap,
} from '@/lib/db';
import { calculateExamSummary } from '@/lib/scoring';
import { buildDynamicBalanced100Set, buildSessionFromTestSet } from '@/lib/set-generator';
import type { ExamMode, ExamSession, TestSetDefinition } from '@/types/mcq';

type TierFilter = 'core' | 'extended' | 'practice' | 'all';

export default function TestSetsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { ready, seeding, testSets, summary } = useAppData();

  const [sessions, setSessions] = useState<ExamSession[]>([]);
  const [tierFilter, setTierFilter] = useState<TierFilter>('core');
  const [mode, setMode] = useState<ExamMode>('exam');
  const [shuffleQuestions, setShuffleQuestions] = useState(true);
  const [shuffleOptions, setShuffleOptions] = useState(false);
  const [launchingId, setLaunchingId] = useState<string | null>(null);

  const loadSessions = useCallback(async () => {
    const list = await getUserSessions(user.id);
    setSessions(list);
  }, [user.id]);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  const setStatsBySetId = useMemo(() => {
    const map = new Map<
      string,
      {
        inProgressSession?: ExamSession;
        latestCompleted?: ExamSession;
        bestPercent: number | null;
        passed: boolean;
        attempts: number;
      }
    >();

    for (const s of sessions) {
      if (!s.setId) continue;
      const entry = map.get(s.setId) ?? {
        bestPercent: null,
        passed: false,
        attempts: 0,
      };

      if (s.status === 'in_progress' && !entry.inProgressSession) {
        entry.inProgressSession = s;
      } else if (s.status === 'completed') {
        entry.attempts += 1;
        const sum = calculateExamSummary(s);
        if (!entry.latestCompleted) entry.latestCompleted = s;
        if (entry.bestPercent === null || sum.overallPercent > entry.bestPercent) {
          entry.bestPercent = sum.overallPercent;
        }
        if (sum.passed) entry.passed = true;
      }

      map.set(s.setId, entry);
    }

    return map;
  }, [sessions]);

  const overviewStats = useMemo(() => {
    let completedSets = 0;
    let passedSets = 0;
    let sumBest = 0;
    for (const st of setStatsBySetId.values()) {
      if (st.attempts > 0 && st.bestPercent !== null) {
        completedSets++;
        sumBest += st.bestPercent;
        if (st.passed) passedSets++;
      }
    }
    return {
      completedSets,
      passedSets,
      avgBest: completedSets > 0 ? Math.round((sumBest / completedSets) * 10) / 10 : null,
    };
  }, [setStatsBySetId]);

  const visibleSets = useMemo(() => {
    if (tierFilter === 'all') return testSets;
    return testSets.filter((s) => s.tier === tierFilter);
  }, [testSets, tierFilter]);

  const handleStartSet = async (testSet: TestSetDefinition) => {
    if (launchingId) return;
    setLaunchingId(testSet.id);
    try {
      const qs = await getQuestionsByIds(testSet.questionIds);
      const effectiveMode: ExamMode =
        testSet.tier === 'practice' ? 'practice' : mode;
      const newSession = buildSessionFromTestSet({
        testSet,
        questions: qs,
        userId: user.id,
        mode: effectiveMode,
        shuffleQuestions,
        shuffleOptions,
      });
      await createSession(newSession);
      router.push(`/exam/${newSession.id}`);
    } finally {
      setLaunchingId(null);
    }
  };

  const handleDynamic100 = async (prioritize: 'unseen' | 'weak') => {
    if (launchingId) return;
    const tag = `dynamic-${prioritize}`;
    setLaunchingId(tag);
    try {
      const [allQs, statsMap] = await Promise.all([
        getAllQuestions(),
        getUserStatsMap(user.id),
      ]);
      const newSession = buildDynamicBalanced100Set({
        allQuestions: allQs,
        statsMap,
        userId: user.id,
        mode,
        prioritize,
        shuffleOptions,
      });
      await createSession(newSession);
      router.push(`/exam/${newSession.id}`);
    } finally {
      setLaunchingId(null);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      {/* Hero Banner */}
      <section className="rounded-2xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-6 sm:p-8 text-white shadow-lg">
        <div className="grid gap-6 lg:grid-cols-12 lg:items-center">
          <div className="lg:col-span-8 space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full bg-indigo-500/20 px-3 py-1 text-xs font-semibold text-indigo-200 ring-1 ring-indigo-400/30">
              <ClipboardList className="h-3.5 w-3.5" />
              30 Mock Sets (100 Qs / 2h) + 20 Practice Sets (50 Qs / Instant Lock)
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Balanced Mock &amp; Practice Test Sets
            </h1>
            <p className="max-w-2xl text-sm text-slate-300 leading-relaxed">
              Every <strong className="text-white">Mock Set (1–30)</strong> gives{' '}
              <strong className="text-white">100 MCQs in 2 hours</strong> (10 Qs per chapter), while
              every <strong className="text-emerald-300">Practice Set (1–20)</strong> gives{' '}
              <strong className="text-white">50 untimed MCQs</strong> (5 Qs per chapter) with{' '}
              <strong className="text-emerald-300">1,000 completely unique questions</strong> and
              instant answer + reason reveal.
            </p>
          </div>

          <div className="lg:col-span-4 grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-white/10 p-3.5 ring-1 ring-white/15">
              <div className="text-xs text-slate-300">Sets Completed</div>
              <div className="mt-1 text-2xl font-bold">
                {overviewStats.completedSets} / {testSets.length || 50}
              </div>
              <div className="text-[11px] text-slate-400">{overviewStats.passedSets} passed</div>
            </div>
            <div className="rounded-xl bg-white/10 p-3.5 ring-1 ring-white/15">
              <div className="text-xs text-slate-300">Best Avg Score</div>
              <div className="mt-1 text-2xl font-bold">
                {overviewStats.avgBest !== null ? `${overviewStats.avgBest}%` : '—'}
              </div>
              <div className="text-[11px] text-slate-400">NEC Pass: 50%</div>
            </div>
          </div>
        </div>
      </section>

      {/* Global Exam Settings & Smart Dynamic Set Generator */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          {/* Exam Mode Selector (for Mock Sets & Dynamic Sets) */}
          <div className="space-y-2">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Mode for 100-Q Mock Sets (Practice Sets 1–20 Always Lock &amp; Reveal)
            </div>
            <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Exam mode">
              <button
                type="button"
                role="radio"
                aria-checked={mode === 'exam'}
                onClick={() => setMode('exam')}
                className={`inline-flex min-h-[42px] items-center gap-2 rounded-xl border-2 px-4 py-2 text-xs font-bold transition cursor-pointer ${
                  mode === 'exam'
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-800'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                <ShieldCheck className="h-4 w-4 text-indigo-600" />
                Real NEC Exam (2h, Answer After Submit)
              </button>

              <button
                type="button"
                role="radio"
                aria-checked={mode === 'practice'}
                onClick={() => setMode('practice')}
                className={`inline-flex min-h-[42px] items-center gap-2 rounded-xl border-2 px-4 py-2 text-xs font-bold transition cursor-pointer ${
                  mode === 'practice'
                    ? 'border-amber-500 bg-amber-50 text-amber-900'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Lock className="h-4 w-4 text-amber-600" />
                Practice Mode (Locks + Instant Reason)
              </button>
            </div>
          </div>

          {/* Toggles */}
          <div className="flex flex-wrap items-center gap-4 text-xs">
            <label className="inline-flex items-center gap-2 cursor-pointer font-semibold text-slate-700">
              <input
                type="checkbox"
                checked={shuffleQuestions}
                onChange={(e) => setShuffleQuestions(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-indigo-600"
              />
              <Shuffle className="h-3.5 w-3.5 text-slate-500" />
              Shuffle Question Order
            </label>
            <label className="inline-flex items-center gap-2 cursor-pointer font-semibold text-slate-700">
              <input
                type="checkbox"
                checked={shuffleOptions}
                onChange={(e) => setShuffleOptions(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-indigo-600"
              />
              Shuffle Options (A–D)
            </label>
          </div>
        </div>

        {/* Dynamic Balanced 100-Q Generators */}
        <div className="flex flex-col gap-3 rounded-xl border border-indigo-100 bg-indigo-50/60 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-0.5">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-indigo-600" />
              Generate Fresh Balanced 100-Q Set (10 Qs/Chapter)
            </h2>
            <p className="text-xs text-slate-600">
              Builds a brand-new randomized 100-Q / 2-hr exam covering all 10 chapters equally,
              prioritizing questions you haven&apos;t practiced yet across all{' '}
              {summary.totalQuestions.toLocaleString()} MCQs.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 shrink-0">
            <button
              type="button"
              disabled={!ready || seeding || launchingId !== null}
              onClick={() => handleDynamic100('unseen')}
              className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-indigo-700 disabled:opacity-50 cursor-pointer"
            >
              <Play className="h-3.5 w-3.5 fill-current" />
              {launchingId === 'dynamic-unseen' ? 'Building...' : 'Smart Unseen 100-Q Set'}
            </button>
            <button
              type="button"
              disabled={!ready || seeding || launchingId !== null}
              onClick={() => handleDynamic100('weak')}
              className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border border-indigo-300 bg-white px-4 py-2 text-xs font-bold text-indigo-700 hover:bg-indigo-50 disabled:opacity-50 cursor-pointer"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              {launchingId === 'dynamic-weak' ? 'Building...' : 'Weak-Area 100-Q Set'}
            </button>
          </div>
        </div>
      </section>

      {/* Tier Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Test set tiers">
          {(
            [
              { id: 'core', label: 'Core Mock 1–18 (100 Qs • 2h)' },
              { id: 'extended', label: 'Extended Mock 19–30 (100 Qs • 2h)' },
              { id: 'practice', label: 'Practice Sets 1–20 (50 Qs • Instant Lock)' },
              { id: 'all', label: `All ${testSets.length || 50} Sets` },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={tierFilter === t.id}
              onClick={() => setTierFilter(t.id)}
              className={`min-h-[40px] rounded-xl px-4 py-2 text-xs font-bold transition cursor-pointer ${
                tierFilter === t.id
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <span className="text-xs font-medium text-slate-500">
          Profile: <strong className="text-slate-800">{user.name}</strong>
        </span>
      </div>

      {/* Sets Grid */}
      {!ready || seeding ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-sm text-slate-500">
          Loading pre-compiled balanced mock and practice sets...
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visibleSets.map((set) => {
            const st = setStatsBySetId.get(set.id);
            const inProgress = st?.inProgressSession;
            const latest = st?.latestCompleted;
            const isLaunching = launchingId === set.id;
            const isPracticeSet = set.tier === 'practice';
            const perChapterCount = isPracticeSet ? 5 : 10;

            return (
              <article
                key={set.id}
                className={`flex flex-col justify-between rounded-2xl border bg-white p-5 shadow-xs transition ${
                  st?.passed
                    ? 'border-emerald-200'
                    : inProgress
                    ? 'border-amber-300'
                    : 'border-slate-200 hover:border-indigo-300 hover:shadow-md'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold text-white ${
                          isPracticeSet ? 'bg-emerald-700' : 'bg-slate-900'
                        }`}
                      >
                        {isPracticeSet ? `P${set.setNumber}` : `#${set.setNumber}`}
                      </span>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                          set.tier === 'core'
                            ? 'bg-indigo-50 text-indigo-700'
                            : set.tier === 'extended'
                            ? 'bg-purple-50 text-purple-700'
                            : 'bg-emerald-50 text-emerald-700'
                        }`}
                      >
                        {set.tier === 'core'
                          ? 'Core Mock (No Repeat)'
                          : set.tier === 'extended'
                          ? 'Extended Mock'
                          : 'Practice (No Repeat)'}
                      </span>
                    </div>

                    {inProgress ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-bold text-amber-800 ring-1 ring-amber-200">
                        <Clock className="h-3 w-3" />
                        {Object.keys(inProgress.answers).length}/{set.questionCount}
                      </span>
                    ) : st?.bestPercent !== null && st?.bestPercent !== undefined ? (
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                          st.passed
                            ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
                            : 'bg-rose-50 text-rose-700 ring-1 ring-rose-200'
                        }`}
                      >
                        {st.passed ? (
                          <CheckCircle2 className="h-3 w-3" />
                        ) : (
                          <Award className="h-3 w-3" />
                        )}
                        Best: {st.bestPercent}%
                      </span>
                    ) : (
                      <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-500">
                        Not Started
                      </span>
                    )}
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-slate-900">{set.title}</h3>
                    <p className="mt-1 text-xs text-slate-500 flex flex-wrap items-center gap-x-3 gap-y-1">
                      <span className="inline-flex items-center gap-1">
                        <Layers className="h-3.5 w-3.5 text-indigo-500" />
                        {set.questionCount} MCQs ({perChapterCount}/Ch)
                      </span>
                      <span className="inline-flex items-center gap-1">
                        {isPracticeSet ? (
                          <>
                            <Lock className="h-3.5 w-3.5 text-emerald-600" />
                            Untimed • Instant Lock
                          </>
                        ) : (
                          <>
                            <Clock className="h-3.5 w-3.5 text-slate-400" />
                            {set.timeLimitMinutes} mins (2h)
                          </>
                        )}
                      </span>
                    </p>
                  </div>

                  {/* Mini 10-chapter pill bar */}
                  <div
                    className="grid grid-cols-10 gap-1 pt-1"
                    title={`${perChapterCount} questions from every chapter Ch 1–Ch 10`}
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((ch) => (
                      <div
                        key={ch}
                        className="rounded bg-slate-100 py-1 text-center text-[10px] font-semibold text-slate-600"
                      >
                        C{ch}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3.5">
                  {inProgress ? (
                    <Link
                      href={`/exam/${inProgress.id}`}
                      className="flex-1 inline-flex min-h-[42px] items-center justify-center gap-1.5 rounded-xl bg-amber-600 px-3 py-2 text-xs font-bold text-white hover:bg-amber-700"
                    >
                      Resume ({inProgress.mode === 'exam' ? 'Exam' : 'Practice'})
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  ) : (
                    <button
                      type="button"
                      disabled={launchingId !== null}
                      onClick={() => handleStartSet(set)}
                      className={`flex-1 inline-flex min-h-[42px] items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold text-white disabled:opacity-50 cursor-pointer ${
                        isPracticeSet
                          ? 'bg-emerald-600 hover:bg-emerald-700'
                          : 'bg-indigo-600 hover:bg-indigo-700'
                      }`}
                    >
                      <Play className="h-3.5 w-3.5 fill-current" />
                      {isLaunching
                        ? 'Starting...'
                        : latest
                        ? 'Retake Set'
                        : isPracticeSet
                        ? 'Start 50-Q Practice'
                        : mode === 'exam'
                        ? 'Start 2h Exam'
                        : 'Start Practice'}
                    </button>
                  )}

                  {latest && (
                    <Link
                      href={`/results/${latest.id}`}
                      className="inline-flex min-h-[42px] items-center justify-center rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      Review
                    </Link>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
