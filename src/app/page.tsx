'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  Award,
  BookOpen,
  CheckCircle2,
  ClipboardList,
  Clock,
  Database,
  Play,
  SlidersHorizontal,
  Smartphone,
  Upload,
} from 'lucide-react';
import { NEC_ASOE_SYLLABUS } from '@/data/nec-asoe-syllabus';
import { useAuth } from '@/components/AuthProvider';
import { useAppData } from '@/components/AppDataProvider';
import { usePwa } from '@/components/PwaProvider';
import { getUserSessions } from '@/lib/db';
import { calculateExamSummary, formatDuration } from '@/lib/scoring';
import { ExamSession } from '@/types/mcq';

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { ready, seeding, seedError, summary, testSets } = useAppData();
  const { canInstall, isInstalled, isIos, promptInstall, openInstallGuide } = usePwa();
  const [sessions, setSessions] = useState<ExamSession[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(true);

  useEffect(() => {
    let active = true;
    setLoadingSessions(true);
    getUserSessions(user.id)
      .then((list) => {
        if (active) setSessions(list);
      })
      .finally(() => {
        if (active) setLoadingSessions(false);
      });
    return () => {
      active = false;
    };
  }, [user.id]);

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

  const loading = !ready || seeding;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Hero Banner */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-6 sm:p-8 text-white shadow-lg">
        <div className="relative z-10 grid gap-6 lg:grid-cols-12 lg:items-center">
          <div className="lg:col-span-8 space-y-4">
            <div className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/logo.webp"
                alt="NEC ASoE Exam Prep logo"
                className="h-12 w-12 shrink-0 rounded-2xl object-cover shadow-md ring-2 ring-white/20"
              />
              <div className="inline-flex items-center gap-2 rounded-full bg-indigo-500/20 px-3 py-1 text-xs font-semibold text-indigo-200 ring-1 ring-indigo-400/30">
                <ClipboardList className="h-3.5 w-3.5" />
                Nepal Engineering Council • Software Engineering (ASoE)
              </div>
            </div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-4xl">
              Complete 3,180-MCQ Bank &amp; 50 Mock/Practice Sets
            </h1>
            <p className="max-w-2xl text-sm sm:text-base text-slate-300 leading-relaxed">
              Pre-loaded with all <strong className="text-white">10 chapters / 60 sections</strong>{' '}
              in an instant offline-ready browser database. Take{' '}
              <strong className="text-emerald-300">30 Mock Sets (100 Qs / 2h)</strong> or{' '}
              <strong className="text-emerald-300">20 Practice Sets (50 Qs / Instant Lock)</strong>{' '}
              with zero repeats.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <Link
                href="/sets"
                className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-indigo-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-400"
              >
                <Play className="h-4 w-4 fill-current" />
                Mock &amp; Practice Sets ({testSets.length || 50})
              </Link>
              <Link
                href="/generator"
                className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-white/10 px-4 py-2.5 text-sm font-semibold text-white ring-1 ring-white/20 transition hover:bg-white/20"
              >
                <SlidersHorizontal className="h-4 w-4" />
                Chapter Generator
              </Link>
              <Link
                href="/upload"
                className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-white/10 px-4 py-2.5 text-sm font-semibold text-white ring-1 ring-white/20 transition hover:bg-white/20"
              >
                <Upload className="h-4 w-4" />
                Upload Custom .xlsx
              </Link>
              {!isInstalled && (canInstall || isIos) && (
                <button
                  type="button"
                  onClick={canInstall ? promptInstall : openInstallGuide}
                  className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-bold text-slate-950 shadow-sm transition hover:bg-emerald-400 cursor-pointer"
                >
                  <Smartphone className="h-4 w-4" />
                  Install Mobile App
                </button>
              )}
            </div>

            {seedError && (
              <div className="rounded-xl bg-rose-500/20 px-4 py-2.5 text-xs font-medium text-rose-200 ring-1 ring-rose-400/40">
                {seedError}
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
              <p className="mt-2 text-2xl font-bold">
                {loading ? '...' : summary.totalQuestions.toLocaleString()}
              </p>
              <p className="mt-0.5 text-xs text-slate-400">
                {summary.workbooks.length} workbook{summary.workbooks.length === 1 ? '' : 's'}
              </p>
            </div>
            <div className="rounded-xl bg-white/10 p-4 backdrop-blur ring-1 ring-white/15">
              <div className="flex items-center gap-2 text-xs text-slate-300">
                <BookOpen className="h-4 w-4 text-emerald-300" />
                Syllabus Covered
              </div>
              <p className="mt-2 text-2xl font-bold">
                {loading ? '...' : `${summary.populatedSectionsCount} / 60`}
              </p>
              <p className="mt-0.5 text-xs text-slate-400">Sub-sections populated</p>
            </div>
            <div className="rounded-xl bg-white/10 p-4 backdrop-blur ring-1 ring-white/15">
              <div className="flex items-center gap-2 text-xs text-slate-300">
                <CheckCircle2 className="h-4 w-4 text-sky-300" />
                Exams Completed
              </div>
              <p className="mt-2 text-2xl font-bold">
                {loadingSessions ? '...' : completedSessions.length}
              </p>
              <p className="mt-0.5 text-xs text-slate-400">
                {activeSessions.length} in progress ({user.name})
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
                Unfinished Exam Session ({activeSessions[0].mode === 'exam' ? 'Real Exam' : 'Practice'})
              </div>
              <h2 className="text-base font-bold text-slate-900">{activeSessions[0].title}</h2>
              <p className="text-xs text-slate-600">
                Answered {Object.keys(activeSessions[0].answers).length} of{' '}
                {activeSessions[0].questionsSnapshot.length} questions • Elapsed{' '}
                {formatDuration(activeSessions[0].elapsedSeconds)}
              </p>
            </div>
            <button
              type="button"
              onClick={() => router.push(`/exam/${activeSessions[0].id}`)}
              className="inline-flex min-h-[42px] items-center gap-2 rounded-xl bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white shadow-xs transition hover:bg-amber-700 cursor-pointer"
            >
              Resume Exam
              <ArrowRight className="h-4 w-4" />
            </button>
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
              Click any chapter or sub-section pill to launch a targeted drill, or take a full
              100-question balanced set.
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
            const count = summary.chapterCounts[ch.chapterNumber] ?? 0;
            const populatedSub = ch.sections.filter(
              (s) => (summary.sectionCounts[s.sectionId] ?? 0) > 0
            ).length;

            return (
              <div
                key={ch.chapterNumber}
                className={`flex flex-col justify-between rounded-2xl border bg-white p-5 shadow-xs transition ${count > 0
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
                      className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${count > 0
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
                      const sCount = summary.sectionCounts[sec.sectionId] ?? 0;
                      return (
                        <Link
                          key={sec.sectionId}
                          href={sCount > 0 ? `/generator?section=${sec.sectionId}` : `/upload`}
                          title={`${sec.sectionId} ${sec.title} (${sCount} MCQs)`}
                          className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition ${sCount > 0
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
              const sum = calculateExamSummary(s);
              return (
                <Link
                  key={s.id}
                  href={`/results/${s.id}`}
                  className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs transition hover:border-indigo-300 hover:shadow-sm"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${sum.passed
                        ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
                        : 'bg-rose-50 text-rose-700 ring-1 ring-rose-200'
                        }`}
                    >
                      {sum.passed ? 'PASSED' : 'NEEDS FOCUS'} • {sum.overallPercent}%
                    </span>
                    <span className="text-xs text-slate-400">
                      {new Date(s.completedAt ?? s.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <h3 className="mt-2 font-bold text-slate-900 truncate">{s.title}</h3>
                  <p className="mt-1 text-xs text-slate-600">
                    Score: <strong>{sum.correct}</strong> / {sum.totalQuestions} • Wrong:{' '}
                    <span className="text-rose-600 font-semibold">{sum.wrong}</span> • Time:{' '}
                    {formatDuration(sum.elapsedSeconds)}
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
