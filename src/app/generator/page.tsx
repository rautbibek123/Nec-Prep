'use client';

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  CheckSquare,
  ChevronDown,
  ChevronRight,
  Clock,
  Layers,
  Lock,
  Play,
  Settings2,
  ShieldCheck,
  Shuffle,
  Square,
  Upload,
} from 'lucide-react';
import { NEC_ASOE_SYLLABUS } from '@/data/nec-asoe-syllabus';
import { useAuth } from '@/components/AuthProvider';
import { useAppData } from '@/components/AppDataProvider';
import {
  createSession,
  getQuestionsBySections,
  getUserStatsMap,
} from '@/lib/db';
import { buildExamSession, filterPoolByConfig } from '@/lib/exam-generator';
import { ExamMode, MCQQuestion, QuestionPoolFilter, QuestionStatRecord } from '@/types/mcq';

function GeneratorContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const configCardRef = useRef<HTMLDivElement | null>(null);

  const { user } = useAuth();
  const { ready, seeding, summary } = useAppData();

  const [statsMap, setStatsMap] = useState<Map<string, QuestionStatRecord>>(new Map());
  const [scopedQuestions, setScopedQuestions] = useState<MCQQuestion[]>([]);
  const [loadingPool, setLoadingPool] = useState(false);

  const [selectedSections, setSelectedSections] = useState<Set<string>>(new Set());
  const [expandedChapters, setExpandedChapters] = useState<Set<number>>(new Set([1]));

  const [questionCount, setQuestionCount] = useState<number>(30);
  const [useAllInPool, setUseAllInPool] = useState<boolean>(false);
  const [shuffleQuestions, setShuffleQuestions] = useState<boolean>(true);
  const [shuffleOptions, setShuffleOptions] = useState<boolean>(false);
  const [balancedAcrossSections, setBalancedAcrossSections] = useState<boolean>(true);
  const [poolFilter, setPoolFilter] = useState<QuestionPoolFilter>('all');
  const [mode, setMode] = useState<ExamMode>('practice');
  const [timeLimitMinutes, setTimeLimitMinutes] = useState<number | null>(30);
  const [examTitle, setExamTitle] = useState<string>('');
  const [launching, setLaunching] = useState<boolean>(false);
  const [initializedScope, setInitializedScope] = useState(false);

  // Initialize selection from query params once AppDataProvider summary is ready
  useEffect(() => {
    if (!ready || seeding || initializedScope) return;

    const populatedSecs = Object.entries(summary.sectionCounts)
      .filter(([, cnt]) => cnt > 0)
      .map(([secId]) => secId);

    const paramChapter = searchParams.get('chapter');
    const paramSection = searchParams.get('section');

    if (paramSection && (summary.sectionCounts[paramSection] ?? 0) > 0) {
      setSelectedSections(new Set([paramSection]));
      const chNum = Number(paramSection.split('.')[0]) || 1;
      setExpandedChapters(new Set([chNum]));
    } else if (paramChapter) {
      const chNum = Number(paramChapter);
      const chSecs = populatedSecs.filter((id) => Number(id.split('.')[0]) === chNum);
      setSelectedSections(new Set(chSecs.length > 0 ? chSecs : populatedSecs));
      setExpandedChapters(new Set([chNum]));
    } else {
      setSelectedSections(new Set(populatedSecs));
      setExpandedChapters(new Set([1]));
    }

    setInitializedScope(true);
  }, [ready, seeding, initializedScope, summary.sectionCounts, searchParams]);

  // Load user stats map when user changes
  useEffect(() => {
    let active = true;
    getUserStatsMap(user.id)
      .then((map) => {
        if (active) setStatsMap(map);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [user.id]);

  const selectedSectionList = useMemo(
    () =>
      Array.from(selectedSections).sort((a, b) =>
        a.localeCompare(b, undefined, { numeric: true })
      ),
    [selectedSections]
  );

  // Fast indexed query fetching ONLY the selected sections from IndexedDB
  const loadScopedPool = useCallback(async (sections: string[]) => {
    if (sections.length === 0) {
      setScopedQuestions([]);
      return;
    }
    setLoadingPool(true);
    try {
      const qs = await getQuestionsBySections(sections);
      setScopedQuestions(qs);
    } finally {
      setLoadingPool(false);
    }
  }, []);

  useEffect(() => {
    if (!ready || seeding) return;
    loadScopedPool(selectedSectionList);
  }, [ready, seeding, selectedSectionList, loadScopedPool]);

  const globalStatCounts = useMemo(() => {
    let attempted = 0;
    let wrongLatest = 0;
    let bookmarked = 0;
    for (const st of statsMap.values()) {
      if (st.attempts > 0) attempted++;
      if (st.lastIsCorrect === false) wrongLatest++;
      if (st.bookmarked) bookmarked++;
    }
    return {
      unseen: Math.max(0, summary.totalQuestions - attempted),
      wrongLatest,
      bookmarked,
    };
  }, [statsMap, summary.totalQuestions]);

  const selectedChaptersList = useMemo(() => {
    const chSet = new Set<number>();
    for (const secId of selectedSectionList) {
      const ch = Number(secId.split('.')[0]);
      if (Number.isFinite(ch) && ch > 0) chSet.add(ch);
    }
    return Array.from(chSet).sort((a, b) => a - b);
  }, [selectedSectionList]);

  const eligiblePool = useMemo(
    () =>
      filterPoolByConfig(scopedQuestions, statsMap, {
        selectedSections: selectedSectionList,
        poolFilter,
      }),
    [scopedQuestions, statsMap, selectedSectionList, poolFilter]
  );

  const effectiveCount = useAllInPool
    ? eligiblePool.length
    : Math.min(Math.max(1, questionCount), eligiblePool.length);

  const toggleSection = (sectionId: string) => {
    if ((summary.sectionCounts[sectionId] ?? 0) === 0) return;
    setSelectedSections((prev) => {
      const next = new Set(prev);
      if (next.has(sectionId)) next.delete(sectionId);
      else next.add(sectionId);
      return next;
    });
  };

  const toggleChapter = (chapterNumber: number) => {
    const ch = NEC_ASOE_SYLLABUS.find((c) => c.chapterNumber === chapterNumber);
    if (!ch) return;
    const populatedIds = ch.sections
      .map((s) => s.sectionId)
      .filter((id) => (summary.sectionCounts[id] ?? 0) > 0);
    if (populatedIds.length === 0) return;

    const allSelected = populatedIds.every((id) => selectedSections.has(id));
    setSelectedSections((prev) => {
      const next = new Set(prev);
      if (allSelected) {
        for (const id of populatedIds) next.delete(id);
      } else {
        for (const id of populatedIds) next.add(id);
      }
      return next;
    });
  };

  const toggleExpandChapter = (chapterNumber: number) => {
    setExpandedChapters((prev) => {
      const next = new Set(prev);
      if (next.has(chapterNumber)) next.delete(chapterNumber);
      else next.add(chapterNumber);
      return next;
    });
  };

  const selectAllPopulated = () => {
    const allPopulated = Object.entries(summary.sectionCounts)
      .filter(([, cnt]) => cnt > 0)
      .map(([id]) => id);
    setSelectedSections(new Set(allPopulated));
  };

  const clearSelection = () => {
    setSelectedSections(new Set());
  };

  const applyPreset = (preset: 'drill20' | 'chapter30' | 'mock100' | 'allUntimed') => {
    if (preset === 'drill20') {
      setUseAllInPool(false);
      setQuestionCount(20);
      setTimeLimitMinutes(20);
      setShuffleQuestions(true);
      setBalancedAcrossSections(true);
    } else if (preset === 'chapter30') {
      setUseAllInPool(false);
      setQuestionCount(30);
      setTimeLimitMinutes(30);
      setShuffleQuestions(true);
      setBalancedAcrossSections(true);
    } else if (preset === 'mock100') {
      selectAllPopulated();
      setUseAllInPool(false);
      setQuestionCount(100);
      setTimeLimitMinutes(120);
      setShuffleQuestions(true);
      setBalancedAcrossSections(true);
    } else if (preset === 'allUntimed') {
      setUseAllInPool(true);
      setTimeLimitMinutes(null);
      setShuffleQuestions(true);
    }
  };

  const handleStartExam = async () => {
    if (eligiblePool.length === 0 || launching) return;
    setLaunching(true);
    try {
      const autoTitle =
        examTitle.trim() ||
        (selectedChaptersList.length === 1
          ? `Chapter ${selectedChaptersList[0]} Exam (${selectedSectionList.join(', ')})`
          : `NEC ASoE Exam — Chapters ${selectedChaptersList.join(', ')}`);

      const session = buildExamSession({
        userId: user.id,
        title: autoTitle,
        pool: eligiblePool,
        mode,
        config: {
          selectedChapters: selectedChaptersList,
          selectedSections: selectedSectionList,
          totalQuestions: effectiveCount,
          shuffleQuestions,
          shuffleOptions,
          balancedAcrossSections,
          poolFilter,
          timeLimitMinutes,
          mode,
        },
      });

      await createSession(session);
      router.push(`/exam/${session.id}`);
    } finally {
      setLaunching(false);
    }
  };

  if (ready && !seeding && summary.totalQuestions === 0) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-14 text-center space-y-5">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
          <Layers className="h-8 w-8" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900">No Questions in Local Bank</h1>
        <p className="mx-auto max-w-lg text-sm text-slate-600">
          Upload an Excel MCQ workbook or re-seed the default 3,180-MCQ bank from the Question Bank
          page.
        </p>
        <Link
          href="/upload"
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
        >
          <Upload className="h-4 w-4" />
          Open Question Bank
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-3 py-6 pb-28 sm:px-6 sm:py-8 lg:pb-8 lg:px-8 space-y-6">
      {/* Page Title & Quick Presets */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Chapter-Wise &amp; Section-Wise Question Generator
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Select chapters or sub-topics across the {summary.totalQuestions.toLocaleString()}-MCQ
            bank, pick Practice or Real Exam mode, and launch.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          <span className="text-xs font-semibold text-slate-500 mr-1">Presets:</span>
          <button
            type="button"
            onClick={() => applyPreset('drill20')}
            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:border-indigo-300 hover:text-indigo-700 cursor-pointer"
          >
            Quick 20 (20m)
          </button>
          <button
            type="button"
            onClick={() => applyPreset('chapter30')}
            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:border-indigo-300 hover:text-indigo-700 cursor-pointer"
          >
            Standard 30 (30m)
          </button>
          <button
            type="button"
            onClick={() => applyPreset('mock100')}
            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:border-indigo-300 hover:text-indigo-700 cursor-pointer"
          >
            NEC Mock 100 (120m)
          </button>
          <button
            type="button"
            onClick={() => applyPreset('allUntimed')}
            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:border-indigo-300 hover:text-indigo-700 cursor-pointer"
          >
            Full Scope (Untimed)
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-12 lg:items-start">
        {/* Left Column: Syllabus Chapters & Sub-sections Tree */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs">
            <span className="font-semibold text-slate-700">
              Selected: {selectedSectionList.length} section
              {selectedSectionList.length === 1 ? '' : 's'} (
              {loadingPool ? '...' : eligiblePool.length} Qs)
            </span>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={selectAllPopulated}
                className="font-semibold text-indigo-600 hover:text-indigo-800 cursor-pointer"
              >
                Select All Available
              </button>
              <span className="text-slate-300">|</span>
              <button
                type="button"
                onClick={clearSelection}
                className="font-semibold text-slate-500 hover:text-slate-800 cursor-pointer"
              >
                Clear
              </button>
            </div>
          </div>

          {NEC_ASOE_SYLLABUS.map((ch) => {
            const populatedSections = ch.sections.filter(
              (s) => (summary.sectionCounts[s.sectionId] ?? 0) > 0
            );
            const chTotal = ch.sections.reduce(
              (sum, s) => sum + (summary.sectionCounts[s.sectionId] ?? 0),
              0
            );
            const selectedInCh = populatedSections.filter((s) =>
              selectedSections.has(s.sectionId)
            ).length;
            const isExpanded = expandedChapters.has(ch.chapterNumber);
            const allChSelected =
              populatedSections.length > 0 && selectedInCh === populatedSections.length;
            const partiallySelected = selectedInCh > 0 && !allChSelected;

            return (
              <div
                key={ch.chapterNumber}
                className={`rounded-2xl border bg-white transition ${
                  selectedInCh > 0 ? 'border-indigo-300 shadow-xs' : 'border-slate-200'
                }`}
              >
                <div className="flex items-start sm:items-center justify-between gap-2.5 p-3.5 sm:p-4">
                  <div className="flex items-start sm:items-center gap-2.5 min-w-0">
                    <button
                      type="button"
                      disabled={chTotal === 0}
                      onClick={() => toggleChapter(ch.chapterNumber)}
                      aria-label={`Toggle Chapter ${ch.chapterNumber}`}
                      className={`mt-0.5 sm:mt-0 shrink-0 transition ${
                        chTotal === 0
                          ? 'cursor-not-allowed text-slate-300'
                          : 'cursor-pointer text-indigo-600 hover:text-indigo-700'
                      }`}
                    >
                      {allChSelected ? (
                        <CheckSquare className="h-5 w-5" />
                      ) : partiallySelected ? (
                        <CheckSquare className="h-5 w-5 opacity-60" />
                      ) : (
                        <Square className="h-5 w-5 text-slate-400" />
                      )}
                    </button>

                    <button
                      type="button"
                      aria-expanded={isExpanded}
                      onClick={() => toggleExpandChapter(ch.chapterNumber)}
                      className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 text-left min-w-0 cursor-pointer"
                    >
                      <div className="flex items-center gap-1.5">
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4 shrink-0 text-slate-400" />
                        ) : (
                          <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />
                        )}
                        <span className="rounded bg-slate-900 px-2 py-0.5 text-[11px] font-bold text-white shrink-0">
                          Ch {ch.chapterNumber}
                        </span>
                        <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[11px] font-semibold text-slate-600 shrink-0">
                          {ch.chapterCode}
                        </span>
                      </div>
                      <span className="font-bold text-xs sm:text-sm text-slate-900 line-clamp-2 sm:truncate">
                        {ch.title}
                      </span>
                    </button>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] sm:text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
                      {chTotal} Qs
                    </span>
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-slate-100 divide-y divide-slate-100 px-3.5 sm:px-4 py-1">
                    {ch.sections.map((sec) => {
                      const count = summary.sectionCounts[sec.sectionId] ?? 0;
                      const checked = selectedSections.has(sec.sectionId);
                      return (
                        <label
                          key={sec.sectionId}
                          className={`flex items-start justify-between gap-3 py-2.5 text-xs ${
                            count > 0 ? 'cursor-pointer hover:bg-slate-50/80' : 'opacity-50'
                          }`}
                        >
                          <div className="flex items-start gap-2.5 min-w-0">
                            <input
                              type="checkbox"
                              disabled={count === 0}
                              checked={checked}
                              onChange={() => toggleSection(sec.sectionId)}
                              className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                            />
                            <div className="min-w-0">
                              <div className="font-semibold text-slate-800">
                                <span className="font-mono text-indigo-700 mr-1.5">
                                  {sec.sectionId}
                                </span>
                                {sec.title}{' '}
                                <span className="font-mono text-[11px] font-normal text-slate-400">
                                  ({sec.syllabusCode})
                                </span>
                              </div>
                              <p className="mt-0.5 text-[11px] text-slate-500 line-clamp-1">
                                {sec.topics}
                              </p>
                            </div>
                          </div>
                          <span
                            className={`shrink-0 rounded-md px-2 py-0.5 font-semibold ${
                              count > 0
                                ? 'bg-indigo-50 text-indigo-700'
                                : 'bg-slate-100 text-slate-400'
                            }`}
                          >
                            {count} Qs
                          </span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Right Sticky Column: Exam Settings & Launch */}
        <div
          ref={configCardRef}
          className="lg:col-span-5 xl:col-span-4 lg:sticky lg:top-28 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm space-y-5"
        >
          <div>
            <h2 className="text-lg font-bold text-slate-900">Exam Configuration</h2>
            <p className="text-xs text-slate-500">
              Pool matching selection:{' '}
              <strong className="text-indigo-700">
                {loadingPool ? 'Loading...' : `${eligiblePool.length} MCQs available`}
              </strong>
            </p>
          </div>

          {/* Exam Mode Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Exam Mode
            </label>
            <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Exam mode">
              <button
                type="button"
                role="radio"
                aria-checked={mode === 'practice'}
                onClick={() => setMode('practice')}
                className={`flex items-center justify-center gap-1.5 rounded-xl border py-2 px-2.5 text-xs font-bold transition cursor-pointer ${
                  mode === 'practice'
                    ? 'border-amber-500 bg-amber-50 text-amber-900'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Lock className="h-3.5 w-3.5 text-amber-600" />
                Practice Lock
              </button>
              <button
                type="button"
                role="radio"
                aria-checked={mode === 'exam'}
                onClick={() => setMode('exam')}
                className={`flex items-center justify-center gap-1.5 rounded-xl border py-2 px-2.5 text-xs font-bold transition cursor-pointer ${
                  mode === 'exam'
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-800'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <ShieldCheck className="h-3.5 w-3.5 text-indigo-600" />
                Real Exam
              </button>
            </div>
          </div>

          {/* Custom Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Exam Session Title (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g., Chapter 4 DSA + DBMS Drill"
              value={examTitle}
              onChange={(e) => setExamTitle(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs focus:border-indigo-500 focus:outline-none"
            />
          </div>

          {/* Question Pool Filter */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Question History Filter ({user.name})
            </label>
            <div className="grid grid-cols-1 gap-1.5">
              {(
                [
                  { id: 'all', label: 'All Questions in Selected Scope' },
                  {
                    id: 'unattempted',
                    label: `Unattempted Only (${globalStatCounts.unseen} unseen globally)`,
                  },
                  {
                    id: 'wrong_previously',
                    label: `Previously Wrong Only (${globalStatCounts.wrongLatest} to master)`,
                  },
                  {
                    id: 'bookmarked',
                    label: `Bookmarked Only (${globalStatCounts.bookmarked} saved)`,
                  },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setPoolFilter(opt.id)}
                  className={`rounded-xl border px-3 py-2 text-left text-xs font-medium transition cursor-pointer ${
                    poolFilter === opt.id
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-800 font-semibold'
                      : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Question Count */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-700">Number of Questions</label>
              <span className="text-xs font-bold text-indigo-700">
                {effectiveCount} / {eligiblePool.length}
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {[10, 20, 30, 50, 100].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => {
                    setUseAllInPool(false);
                    setQuestionCount(n);
                  }}
                  className={`rounded-lg border px-2.5 py-1 text-xs font-semibold transition cursor-pointer ${
                    !useAllInPool && questionCount === n
                      ? 'border-indigo-600 bg-indigo-600 text-white'
                      : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {n}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setUseAllInPool(true)}
                className={`rounded-lg border px-2.5 py-1 text-xs font-semibold transition cursor-pointer ${
                  useAllInPool
                    ? 'border-indigo-600 bg-indigo-600 text-white'
                    : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                }`}
              >
                All ({eligiblePool.length})
              </button>
            </div>
            {!useAllInPool && eligiblePool.length > 1 && (
              <input
                type="range"
                aria-label="Number of questions slider"
                min={1}
                max={Math.max(1, eligiblePool.length)}
                value={Math.min(questionCount, Math.max(1, eligiblePool.length))}
                onChange={(e) => setQuestionCount(Number(e.target.value))}
                className="w-full accent-indigo-600"
              />
            )}
          </div>

          {/* Timer Selection */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 mb-1.5">
              <Clock className="h-3.5 w-3.5 text-slate-500" />
              Exam Timer
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {(
                [
                  { val: null, label: 'Untimed' },
                  { val: 15, label: '15 min' },
                  { val: 30, label: '30 min' },
                  { val: 60, label: '60 min' },
                  { val: 90, label: '90 min' },
                  { val: 120, label: '120 min' },
                ] as const
              ).map((t) => (
                <button
                  key={String(t.val)}
                  type="button"
                  onClick={() => setTimeLimitMinutes(t.val)}
                  className={`rounded-lg border py-1.5 text-xs font-semibold transition cursor-pointer ${
                    timeLimitMinutes === t.val
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Toggles */}
          <div className="space-y-2 border-t border-slate-100 pt-3 text-xs">
            <label className="flex items-center justify-between cursor-pointer">
              <span className="flex items-center gap-1.5 font-medium text-slate-700">
                <Shuffle className="h-3.5 w-3.5 text-slate-500" />
                Randomize Question Order
              </span>
              <input
                type="checkbox"
                checked={shuffleQuestions}
                onChange={(e) => setShuffleQuestions(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-indigo-600"
              />
            </label>

            {shuffleQuestions && (
              <label className="flex items-center justify-between cursor-pointer">
                <span className="font-medium text-slate-700">
                  Balance Evenly Across Selected Sections
                </span>
                <input
                  type="checkbox"
                  checked={balancedAcrossSections}
                  onChange={(e) => setBalancedAcrossSections(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-indigo-600"
                />
              </label>
            )}

            <label className="flex items-center justify-between cursor-pointer">
              <span className="font-medium text-slate-700">Shuffle Options (A–D)</span>
              <input
                type="checkbox"
                checked={shuffleOptions}
                onChange={(e) => setShuffleOptions(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-indigo-600"
              />
            </label>
          </div>

          {/* Mode Reminder */}
          <div className="rounded-xl bg-amber-50/90 border border-amber-200 p-3 text-[11px] text-amber-900 space-y-1">
            {mode === 'practice' ? (
              <>
                <div className="font-bold">Practice Lock Mode:</div>
                <div>• First click locks permanently and reveals the answer + reason.</div>
              </>
            ) : (
              <>
                <div className="font-bold">Real NEC Exam Mode:</div>
                <div>• Change choices freely and view results + explanations on submit.</div>
              </>
            )}
          </div>

          <button
            type="button"
            disabled={eligiblePool.length === 0 || launching}
            onClick={handleStartExam}
            className="w-full inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
          >
            <Play className="h-4 w-4 fill-current" />
            {launching
              ? 'Preparing Exam...'
              : eligiblePool.length === 0
              ? 'No Questions Match Scope'
              : `Start Exam (${effectiveCount} MCQs)`}
          </button>
        </div>
      </div>

      {/* Mobile Floating Action Bar (< lg) */}
      <div className="no-print fixed bottom-14 md:bottom-0 inset-x-0 z-30 border-t border-slate-200 bg-white/95 backdrop-blur px-3 py-2.5 lg:hidden shadow-lg">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-2">
          <div className="min-w-0">
            <div className="text-xs font-bold text-slate-900 truncate">
              {effectiveCount} MCQs •{' '}
              {timeLimitMinutes !== null ? `${timeLimitMinutes}m Timer` : 'Untimed'}
            </div>
            <div className="text-[11px] text-slate-500 truncate">
              {selectedSectionList.length} section(s) • Pool: {eligiblePool.length}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() =>
                configCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
              }
              className="inline-flex min-h-[40px] items-center gap-1 rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700"
            >
              <Settings2 className="h-3.5 w-3.5" />
              Settings
            </button>
            <button
              type="button"
              disabled={eligiblePool.length === 0 || launching}
              onClick={handleStartExam}
              className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white disabled:opacity-50"
            >
              <Play className="h-3.5 w-3.5 fill-current" />
              Start ({effectiveCount})
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function GeneratorPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-7xl px-4 py-12 text-center text-sm text-slate-500">
          Loading syllabus &amp; question bank...
        </div>
      }
    >
      <GeneratorContent />
    </Suspense>
  );
}
