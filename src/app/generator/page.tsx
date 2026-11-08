'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  CheckSquare,
  ChevronDown,
  ChevronRight,
  Clock,
  Layers,
  Play,
  Shuffle,
  Sparkles,
  Square,
  Upload,
} from 'lucide-react';
import { NEC_ASOE_SYLLABUS } from '@/data/nec-asoe-syllabus';
import { createSession, getAllQuestions, getAllSessions } from '@/lib/db';
import {
  buildExamSession,
  computeHistoricalQuestionStats,
  filterPoolByConfig,
} from '@/lib/exam-generator';
import { loadBundledChapter1Sample } from '@/lib/sample-loader';
import { ExamSession, MCQQuestion, QuestionPoolFilter } from '@/types/mcq';

function GeneratorContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [questions, setQuestions] = useState<MCQQuestion[]>([]);
  const [pastSessions, setPastSessions] = useState<ExamSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);

  const [selectedSections, setSelectedSections] = useState<Set<string>>(new Set());
  const [expandedChapters, setExpandedChapters] = useState<Set<number>>(new Set([1]));

  const [questionCount, setQuestionCount] = useState<number>(30);
  const [useAllInPool, setUseAllInPool] = useState<boolean>(false);
  const [shuffleQuestions, setShuffleQuestions] = useState<boolean>(true);
  const [balancedAcrossSections, setBalancedAcrossSections] = useState<boolean>(true);
  const [poolFilter, setPoolFilter] = useState<QuestionPoolFilter>('all');
  const [timeLimitMinutes, setTimeLimitMinutes] = useState<number | null>(30);
  const [examTitle, setExamTitle] = useState<string>('');
  const [launching, setLaunching] = useState<boolean>(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [qs, sess] = await Promise.all([getAllQuestions(), getAllSessions()]);
      setQuestions(qs);
      setPastSessions(sess);

      const paramChapter = searchParams.get('chapter');
      const paramSection = searchParams.get('section');

      const populatedSecs = new Set(qs.map((q) => q.sectionId));

      if (paramSection && populatedSecs.has(paramSection)) {
        setSelectedSections(new Set([paramSection]));
        const chNum = Number(paramSection.split('.')[0]) || 1;
        setExpandedChapters(new Set([chNum]));
      } else if (paramChapter) {
        const chNum = Number(paramChapter);
        const chSecs = qs
          .filter((q) => q.chapterNumber === chNum)
          .map((q) => q.sectionId);
        setSelectedSections(new Set(chSecs.length > 0 ? chSecs : Array.from(populatedSecs)));
        setExpandedChapters(new Set([chNum]));
      } else {
        setSelectedSections(populatedSecs);
        const firstPopulatedChapter = qs[0]?.chapterNumber ?? 1;
        setExpandedChapters(new Set([firstPopulatedChapter]));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSeedSample = async () => {
    setSeeding(true);
    try {
      await loadBundledChapter1Sample();
      await loadData();
    } finally {
      setSeeding(false);
    }
  };

  const sectionCounts = useMemo(() => {
    const map = new Map<string, number>();
    for (const q of questions) {
      map.set(q.sectionId, (map.get(q.sectionId) ?? 0) + 1);
    }
    return map;
  }, [questions]);

  const historyStats = useMemo(
    () => computeHistoricalQuestionStats(pastSessions),
    [pastSessions]
  );

  const selectedSectionList = useMemo(
    () =>
      Array.from(selectedSections).sort((a, b) =>
        a.localeCompare(b, undefined, { numeric: true })
      ),
    [selectedSections]
  );

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
      filterPoolByConfig(questions, pastSessions, {
        selectedSections: selectedSectionList,
        poolFilter,
      }),
    [questions, pastSessions, selectedSectionList, poolFilter]
  );

  const effectiveCount = useAllInPool
    ? eligiblePool.length
    : Math.min(Math.max(1, questionCount), eligiblePool.length);

  const toggleSection = (sectionId: string) => {
    if ((sectionCounts.get(sectionId) ?? 0) === 0) return;
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
      .filter((id) => (sectionCounts.get(id) ?? 0) > 0);
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
    setSelectedSections(new Set(questions.map((q) => q.sectionId)));
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
        title: autoTitle,
        pool: eligiblePool,
        config: {
          selectedChapters: selectedChaptersList,
          selectedSections: selectedSectionList,
          totalQuestions: effectiveCount,
          shuffleQuestions,
          balancedAcrossSections,
          poolFilter,
          timeLimitMinutes,
        },
      });

      await createSession(session);
      router.push(`/exam/${session.id}`);
    } finally {
      setLaunching(false);
    }
  };

  if (!loading && questions.length === 0) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-14 text-center space-y-5">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
          <Layers className="h-8 w-8" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900">No Questions in Local Bank Yet</h1>
        <p className="mx-auto max-w-lg text-sm text-slate-600">
          Upload an Excel MCQ workbook (or load your Chapter 1 Fundamentals of IT 180-MCQ workbook
          with one click) to generate chapter-wise and section-wise exams.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={handleSeedSample}
            disabled={seeding}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-indigo-700 disabled:opacity-60 cursor-pointer"
          >
            <Sparkles className="h-4 w-4" />
            {seeding ? 'Loading 180 MCQs...' : 'Load Sample Chapter 1 (180 MCQs)'}
          </button>
          <Link
            href="/upload"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            <Upload className="h-4 w-4" />
            Upload Custom Excel (.xlsx)
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      {/* Page Title & Quick Presets */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Chapter-Wise &amp; Section-Wise Question Generator
          </h1>
          <p className="text-sm text-slate-600">
            Select chapters or sub-topics from the NEC Software Engineering (ASoE) syllabus, choose
            question count &amp; timer, and begin your locked exam.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-slate-500 mr-1">Presets:</span>
          <button
            type="button"
            onClick={() => applyPreset('drill20')}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:border-indigo-300 hover:text-indigo-700 cursor-pointer"
          >
            Quick 20 (20m)
          </button>
          <button
            type="button"
            onClick={() => applyPreset('chapter30')}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:border-indigo-300 hover:text-indigo-700 cursor-pointer"
          >
            Standard 30 (30m)
          </button>
          <button
            type="button"
            onClick={() => applyPreset('mock100')}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:border-indigo-300 hover:text-indigo-700 cursor-pointer"
          >
            NEC Mock 100 (120m)
          </button>
          <button
            type="button"
            onClick={() => applyPreset('allUntimed')}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:border-indigo-300 hover:text-indigo-700 cursor-pointer"
          >
            Full Bank (Untimed)
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-12 lg:items-start">
        {/* Left Column: Syllabus Chapters & Sub-sections Tree */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-3">
          <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs">
            <span className="font-semibold text-slate-700">
              Selected: {selectedSectionList.length} section
              {selectedSectionList.length === 1 ? '' : 's'} across {selectedChaptersList.length}{' '}
              chapter{selectedChaptersList.length === 1 ? '' : 's'}
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
              (s) => (sectionCounts.get(s.sectionId) ?? 0) > 0
            );
            const chTotal = ch.sections.reduce(
              (sum, s) => sum + (sectionCounts.get(s.sectionId) ?? 0),
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
                <div className="flex items-center justify-between gap-3 p-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <button
                      type="button"
                      disabled={chTotal === 0}
                      onClick={() => toggleChapter(ch.chapterNumber)}
                      className={`shrink-0 transition ${
                        chTotal === 0
                          ? 'cursor-not-allowed text-slate-300'
                          : 'cursor-pointer text-indigo-600 hover:text-indigo-700'
                      }`}
                      title={
                        chTotal === 0
                          ? 'Upload Excel file for this chapter first'
                          : 'Toggle entire chapter'
                      }
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
                      onClick={() => toggleExpandChapter(ch.chapterNumber)}
                      className="flex items-center gap-2 text-left min-w-0 cursor-pointer"
                    >
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4 shrink-0 text-slate-400" />
                      ) : (
                        <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />
                      )}
                      <span className="rounded bg-slate-900 px-2 py-0.5 text-xs font-bold text-white shrink-0">
                        Ch {ch.chapterNumber}
                      </span>
                      <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[11px] font-semibold text-slate-600 shrink-0">
                        {ch.chapterCode}
                      </span>
                      <span className="font-bold text-sm text-slate-900 truncate">{ch.title}</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {chTotal > 0 ? (
                      <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
                        {chTotal} MCQs
                      </span>
                    ) : (
                      <Link
                        href="/upload"
                        className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-medium text-slate-500 hover:bg-indigo-50 hover:text-indigo-700"
                      >
                        0 MCQs • Upload
                      </Link>
                    )}
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-slate-100 divide-y divide-slate-100 px-4 py-1">
                    {ch.sections.map((sec) => {
                      const count = sectionCounts.get(sec.sectionId) ?? 0;
                      const checked = selectedSections.has(sec.sectionId);
                      return (
                        <label
                          key={sec.sectionId}
                          className={`flex items-start justify-between gap-3 py-2.5 text-xs ${
                            count > 0 ? 'cursor-pointer hover:bg-slate-50/80' : 'opacity-50'
                          }`}
                        >
                          <div className="flex items-start gap-2.5">
                            <input
                              type="checkbox"
                              disabled={count === 0}
                              checked={checked}
                              onChange={() => toggleSection(sec.sectionId)}
                              className="mt-0.5 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                            />
                            <div>
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
        <div className="lg:col-span-5 xl:col-span-4 lg:sticky lg:top-20 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Exam Configuration</h2>
            <p className="text-xs text-slate-500">
              Pool matching selection:{' '}
              <strong className="text-indigo-700">{eligiblePool.length} MCQs available</strong>
            </p>
          </div>

          {/* Custom Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Exam Session Title (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g., Chapter 1 Full Mock Test"
              value={examTitle}
              onChange={(e) => setExamTitle(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs focus:border-indigo-500 focus:outline-none"
            />
          </div>

          {/* Question Pool Filter */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Question History Filter
            </label>
            <div className="grid grid-cols-1 gap-1.5">
              {(
                [
                  { id: 'all', label: 'All Questions in Selected Scope' },
                  {
                    id: 'unattempted',
                    label: `Unattempted Only (${
                      questions.length - historyStats.attemptedIds.size
                    } unseen globally)`,
                  },
                  {
                    id: 'wrong_previously',
                    label: `Previously Wrong Only (${historyStats.wrongLatestIds.size} to master)`,
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
          </div>

          {/* Exam Rules Reminder */}
          <div className="rounded-xl bg-amber-50/90 border border-amber-200 p-3 text-[11px] text-amber-900 space-y-1">
            <div className="font-bold">Strict Exam Rules Active:</div>
            <div>• Clicking an option permanently locks that question (no re-selection).</div>
            <div>• Wrong choices immediately reveal the Correct Option + Explanation.</div>
          </div>

          <button
            type="button"
            disabled={eligiblePool.length === 0 || launching}
            onClick={handleStartExam}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
          >
            <Play className="h-4 w-4 fill-current" />
            {launching
              ? 'Preparing Exam...'
              : eligiblePool.length === 0
              ? 'Select Sections with Questions'
              : `Start Exam (${effectiveCount} MCQs)`}
          </button>
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

