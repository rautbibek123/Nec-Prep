'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  Award,
  BookOpen,
  CheckCircle2,
  Clock,
  Database,
  FileSpreadsheet,
  Lock,
  Play,
  Sparkles,
  Upload,
} from 'lucide-react';
import { NEC_ASOE_SYLLABUS } from '@/data/nec-asoe-syllabus';
import { getAllQuestions, getAllSessions, getAllWorkbooks } from '@/lib/db';
import { loadBundledChapter1Sample, SAMPLE_CH1_FILENAME } from '@/lib/sample-loader';
import { calculateExamSummary, formatDuration } from '@/lib/scoring';
import { ExamSession, MCQQuestion, UploadedWorkbookMeta } from '@/types/mcq';

export default function DashboardPage() {
  const router = useRouter();
  const [questions, setQuestions] = useState<MCQQuestion[]>([]);
  const [workbooks, setWorkbooks] = useState<UploadedWorkbookMeta[]>([]);
  const [sessions, setSessions] = useState<ExamSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [seedMessage, setSeedMessage] = useState<string | null>(null);

  const refreshData = async () => {
    try {
      const [q, wb, s] = await Promise.all([
        getAllQuestions(),
        getAllWorkbooks(),
        getAllSessions(),
      ]);
      setQuestions(q);
      setWorkbooks(wb);
      setSessions(s);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  const handleLoadSample = async () => {
    setSeeding(true);
    setSeedMessage(null);
    try {
      const res = await loadBundledChapter1Sample();
      setSeedMessage(
        `Loaded ${res.meta.totalQuestions} MCQs across sections ${res.meta.sectionsCovered.join(
          ', '
        )} from ${SAMPLE_CH1_FILENAME}.`
      );
      await refreshData();
    } catch (err) {
      setSeedMessage(err instanceof Error ? err.message : 'Failed to load sample workbook.');
    } finally {
      setSeeding(false);
    }
  };

  const chapterCounts = useMemo(() => {
    const map = new Map<number, number>();
    for (const q of questions) {
      map.set(q.chapterNumber, (map.get(q.chapterNumber) ?? 0) + 1);
    }
    return map;
  }, [questions]);

  const sectionCounts = useMemo(() => {
    const map = new Map<string, number>();
    for (const q of questions) {
      map.set(q.sectionId, (map.get(q.sectionId) ?? 0) + 1);
    }
    return map;
  }, [questions]);

  const activeSessions = useMemo(
    () => sessions.filter((s) => s.status === 'in_progress'),
    [sessions]
  );

  const completedSessions = useMemo(
    () => sessions.filter((s) => s.status === 'completed'),
    [sessions]
  );

  const averageScore = useMemo(() => {
    if (completedSessions.length === 0) return null;
    const sum = completedSessions.reduce(
      (acc, s) => acc + calculateExamSummary(s).overallPercent,
      0
    );
    return Math.round((sum / completedSessions.length) * 10) / 10;
  }, [completedSessions]);

  const populatedSectionsCount = Array.from(sectionCounts.values()).filter((c) => c > 0).length;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Hero Banner */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-6 sm:p-8 text-white shadow-lg">
        <div className="relative z-10 grid gap-6 lg:grid-cols-12 lg:items-center">
          <div className="lg:col-span-8 space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full bg-indigo-500/20 px-3 py-1 text-xs font-semibold text-indigo-200 ring-1 ring-indigo-400/30">
              <Lock className="h-3.5 w-3.5" />
              Nepal Engineering Council • Software Engineering (ASoE)
            </div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-4xl">
              Excel MCQ Extractor &amp; Chapter-Wise Exam Simulator
            </h1>
            <p className="max-w-2xl text-sm sm:text-base text-slate-300 leading-relaxed">
              Upload your NEC chapter Excel workbooks, generate randomized chapter or sub-topic
              exams, and test honestly: <strong className="text-white">each choice locks permanently</strong>{' '}
              and immediately reveals the <strong className="text-emerald-300">correct option + valid reason</strong>.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <Link
                href="/generator"
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-400"
              >
                <Play className="h-4 w-4 fill-current" />
                Generate Chapter Exam
              </Link>
              <Link
                href="/upload"
                className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2.5 text-sm font-semibold text-white ring-1 ring-white/20 transition hover:bg-white/20"
              >
                <Upload className="h-4 w-4" />
                Upload Excel (.xlsx)
              </Link>
              {questions.length === 0 && !loading && (
                <button
                  onClick={handleLoadSample}
                  disabled={seeding}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-slate-950 shadow-sm transition hover:bg-emerald-400 disabled:opacity-60 cursor-pointer"
                >
                  <Sparkles className="h-4 w-4" />
                  {seeding ? 'Extracting 180 MCQs...' : 'Load Ch 1 Sample (180 MCQs)'}
                </button>
              )}
            </div>

            {seedMessage && (
              <div className="rounded-xl bg-emerald-500/20 px-4 py-2.5 text-xs font-medium text-emerald-200 ring-1 ring-emerald-400/40">
                {seedMessage}
              </div>
            )}
          </div>

          {/* Quick Stats */}
          <div className="lg:col-span-4 grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-white/10 p-4 backdrop-blur ring-1 ring-white/15">
              <div className="flex items-center gap-2 text-xs text-slate-300">
                <Database className="h-4 w-4 text-indigo-300" />
                Question Bank
              </div>
              <p className="mt-2 text-2xl font-bold">{loading ? '...' : questions.length}</p>
              <p className="mt-0.5 text-xs text-slate-400">
                {workbooks.length} Excel workbook{workbooks.length === 1 ? '' : 's'}
              </p>
            </div>
            <div className="rounded-xl bg-white/10 p-4 backdrop-blur ring-1 ring-white/15">
              <div className="flex items-center gap-2 text-xs text-slate-300">
                <BookOpen className="h-4 w-4 text-emerald-300" />
                Syllabus Covered
              </div>
              <p className="mt-2 text-2xl font-bold">
                {loading ? '...' : `${populatedSectionsCount} / 60`}
              </p>
              <p className="mt-0.5 text-xs text-slate-400">Sub-sections populated</p>
            </div>
            <div className="rounded-xl bg-white/10 p-4 backdrop-blur ring-1 ring-white/15">
              <div className="flex items-center gap-2 text-xs text-slate-300">
                <CheckCircle2 className="h-4 w-4 text-sky-300" />
                Exams Completed
              </div>
              <p className="mt-2 text-2xl font-bold">
                {loading ? '...' : completedSessions.length}
              </p>
              <p className="mt-0.5 text-xs text-slate-400">
                {activeSessions.length} in progress
              </p>
            </div>
            <div className="rounded-xl bg-white/10 p-4 backdrop-blur ring-1 ring-white/15">
              <div className="flex items-center gap-2 text-xs text-slate-300">
                <Award className="h-4 w-4 text-amber-300" />
                Average Score
              </div>
              <p className="mt-2 text-2xl font-bold">
                {averageScore !== null ? `${averageScore}%` : '—'}
              </p>
              <p className="mt-0.5 text-xs text-slate-400">NEC Pass: 50%</p>
            </div>
          </div>
        </div>
      </section>

      {/* Active Unfinished Exam Banner */}
      {activeSessions.length > 0 && (
        <section className="rounded-2xl border border-amber-200 bg-amber-50/80 p-5 shadow-xs">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-800">
                <Clock className="h-4 w-4" />
                Unfinished Exam Session
              </div>
              <h2 className="text-base font-bold text-slate-900">{activeSessions[0].title}</h2>
              <p className="text-xs text-slate-600">
                Answered {Object.keys(activeSessions[0].answers).length} of{' '}
                {activeSessions[0].questionsSnapshot.length} questions • Elapsed{' '}
                {formatDuration(activeSessions[0].elapsedSeconds)}
              </p>
            </div>
            <div className="flex items-center gap-2.5">
              <button
                onClick={() => router.push(`/exam/${activeSessions[0].id}`)}
                className="inline-flex items-center gap-2 rounded-xl bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white shadow-xs transition hover:bg-amber-700 cursor-pointer"
              >
                Resume Exam
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Empty Bank Onboarding Prompt */}
      {!loading && questions.length === 0 && (
        <section className="rounded-2xl border-2 border-dashed border-indigo-200 bg-indigo-50/40 p-6 sm:p-8">
          <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
            <div className="space-y-1.5">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5 text-indigo-600" />
                Ready for Your First Excel Workbook!
              </h2>
              <p className="text-sm text-slate-600 max-w-2xl">
                Upload <code className="rounded bg-white px-1.5 py-0.5 text-xs font-semibold text-indigo-700 border border-indigo-100">NEC_ASoE_Ch1_Fundamentals_of_IT_180_MCQs.xlsx</code>{' '}
                (or click <strong>Load Ch 1 Sample</strong>) to instantly populate Chapter 1
                sections <code className="text-xs font-semibold">1.1</code> through{' '}
                <code className="text-xs font-semibold">1.6</code> with 180 MCQs and explanations.
              </p>
            </div>
            <div className="flex flex-wrap gap-2.5">
              <button
                onClick={handleLoadSample}
                disabled={seeding}
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-xs transition hover:bg-indigo-700 disabled:opacity-60 cursor-pointer"
              >
                <Sparkles className="h-4 w-4" />
                {seeding ? 'Loading...' : 'One-Click Load Ch 1 (180 MCQs)'}
              </button>
              <Link
                href="/upload"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                <Upload className="h-4 w-4" />
                Go to Excel Uploader
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* 10-Chapter NEC Syllabus Grid */}
      <section className="space-y-4">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              NEC Software Engineering Syllabus Chapters (1–10)
            </h2>
            <p className="text-sm text-slate-500">
              Click any populated chapter to launch a chapter-wise exam, or upload Excel sheets for
              remaining chapters.
            </p>
          </div>
          <Link
            href="/syllabus"
            className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 inline-flex items-center gap-1"
          >
            Full 60-Section Syllabus Details
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {NEC_ASOE_SYLLABUS.map((ch) => {
            const count = chapterCounts.get(ch.chapterNumber) ?? 0;
            const populatedSub = ch.sections.filter(
              (s) => (sectionCounts.get(s.sectionId) ?? 0) > 0
            ).length;

            return (
              <div
                key={ch.chapterNumber}
                className={`flex flex-col justify-between rounded-2xl border bg-white p-5 shadow-xs transition ${
                  count > 0
                    ? 'border-indigo-200 hover:border-indigo-300 hover:shadow-md'
                    : 'border-slate-200'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-xs font-bold text-white">
                        Ch {ch.chapterNumber}
                      </span>
                      <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-mono font-semibold text-slate-700">
                        {ch.chapterCode}
                      </span>
                      <span className="text-[11px] font-medium text-slate-400">
                        {ch.category}
                      </span>
                    </div>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        count > 0
                          ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {count} MCQs
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 leading-snug">{ch.title}</h3>

                  {/* Sub-section pills */}
                  <div className="flex flex-wrap gap-1.5">
                    {ch.sections.map((sec) => {
                      const sCount = sectionCounts.get(sec.sectionId) ?? 0;
                      return (
                        <Link
                          key={sec.sectionId}
                          href={
                            sCount > 0
                              ? `/generator?section=${sec.sectionId}`
                              : `/upload`
                          }
                          title={`${sec.sectionId} ${sec.title} (${sCount} MCQs)`}
                          className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition ${
                            sCount > 0
                              ? 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                              : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                          }`}
                        >
                          <span>{sec.sectionId}</span>
                          {sCount > 0 && (
                            <span className="rounded bg-white px-1 text-[10px] font-bold text-indigo-700">
                              {sCount}
                            </span>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3.5">
                  <span className="text-xs text-slate-500">
                    {populatedSub} of {ch.sections.length} sections loaded
                  </span>
                  {count > 0 ? (
                    <Link
                      href={`/generator?chapter=${ch.chapterNumber}`}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white transition hover:bg-indigo-700"
                    >
                      Practice Chapter {ch.chapterNumber}
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  ) : (
                    <Link
                      href="/upload"
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
                    >
                      <Upload className="h-3.5 w-3.5" />
                      Upload Excel
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Recent Completed Exams */}
      {completedSessions.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">Recent Exam Results</h2>
            <Link
              href="/results"
              className="text-sm font-semibold text-indigo-600 hover:text-indigo-700"
            >
              View All History →
            </Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {completedSessions.slice(0, 3).map((s) => {
              const summary = calculateExamSummary(s);
              return (
                <Link
                  key={s.id}
                  href={`/results/${s.id}`}
                  className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs transition hover:border-indigo-300 hover:shadow-sm"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                        summary.passed
                          ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
                          : 'bg-rose-50 text-rose-700 ring-1 ring-rose-200'
                      }`}
                    >
                      {summary.passed ? 'PASSED' : 'NEEDS FOCUS'} • {summary.overallPercent}%
                    </span>
                    <span className="text-xs text-slate-400">
                      {new Date(s.completedAt ?? s.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <h3 className="mt-2 font-bold text-slate-900 truncate">{s.title}</h3>
                  <p className="mt-1 text-xs text-slate-600">
                    Score: <strong>{summary.correct}</strong> / {summary.totalQuestions} • Wrong:{' '}
                    <span className="text-rose-600 font-semibold">{summary.wrong}</span> • Time:{' '}
                    {formatDuration(summary.elapsedSeconds)}
                  </p>
                </Link>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}

