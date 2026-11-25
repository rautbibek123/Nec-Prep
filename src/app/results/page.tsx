'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Award,
  Clock,
  History,
  Lock,
  Play,
  ShieldCheck,
  Trash2,
} from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { deleteSessionById, getUserSessions } from '@/lib/db';
import { calculateExamSummary, formatDuration } from '@/lib/scoring';
import { ExamSession } from '@/types/mcq';

export default function ResultsHistoryPage() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<ExamSession[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const list = await getUserSessions(user.id);
      setSessions(list);
    } finally {
      setLoading(false);
    }
  }, [user.id]);

  useEffect(() => {
    load();
  }, [load]);

  const handleDelete = async (id: string) => {
    await deleteSessionById(id);
    await load();
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Exam Attempts &amp; Result History
          </h1>
          <p className="text-sm text-slate-600">
            Showing attempts for <strong className="text-slate-800">{user.name}</strong>. Review
            past scorecards, section accuracy, or resume an unfinished exam.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/sets"
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            <Play className="h-4 w-4 fill-current" />
            100-Q Test Sets
          </Link>
          <Link
            href="/generator"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Custom Exam
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="py-16 text-center text-sm text-slate-500">Loading exam history...</div>
      ) : sessions.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center space-y-4">
          <History className="mx-auto h-10 w-10 text-slate-400" />
          <h2 className="text-lg font-bold text-slate-900">No Exam Sessions Yet</h2>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            Take one of the 30 balanced 100-question mock sets or build a custom chapter exam to
            track your NEC readiness.
          </p>
          <Link
            href="/sets"
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white"
          >
            Browse 100-Q Test Sets
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {sessions.map((s) => {
            const summary = calculateExamSummary(s);
            const isCompleted = s.status === 'completed';

            return (
              <div
                key={s.id}
                className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs sm:flex-row sm:items-center sm:justify-between hover:border-indigo-200 transition"
              >
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    {isCompleted ? (
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${
                          summary.passed
                            ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
                            : 'bg-rose-50 text-rose-700 ring-1 ring-rose-200'
                        }`}
                      >
                        <Award className="h-3.5 w-3.5" />
                        {summary.overallPercent}% ({summary.correct}/{summary.totalQuestions})
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-bold text-amber-800 ring-1 ring-amber-200">
                        <Clock className="h-3.5 w-3.5" />
                        In Progress ({summary.attempted}/{summary.totalQuestions})
                      </span>
                    )}

                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                      {s.mode === 'exam' ? (
                        <>
                          <ShieldCheck className="h-3 w-3 text-indigo-600" /> Real Exam
                        </>
                      ) : (
                        <>
                          <Lock className="h-3 w-3 text-amber-600" /> Practice
                        </>
                      )}
                    </span>

                    {s.setNumber && (
                      <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] font-bold text-indigo-700">
                        Set #{s.setNumber}
                      </span>
                    )}

                    <span className="text-xs text-slate-400">
                      {new Date(s.completedAt ?? s.createdAt).toLocaleString()}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900">{s.title}</h3>
                  <p className="text-xs text-slate-600">
                    {s.config.selectedSections.length} section(s) • Correct:{' '}
                    <strong className="text-emerald-700">{summary.correct}</strong> • Wrong:{' '}
                    <strong className="text-rose-600">{summary.wrong}</strong> • Skipped:{' '}
                    <strong>{summary.skipped}</strong> • Time:{' '}
                    {formatDuration(summary.elapsedSeconds)}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Link
                    href={isCompleted ? `/results/${s.id}` : `/exam/${s.id}`}
                    className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold text-white transition ${
                      isCompleted
                        ? 'bg-slate-900 hover:bg-slate-800'
                        : 'bg-amber-600 hover:bg-amber-700'
                    }`}
                  >
                    {isCompleted ? 'View Full Report' : 'Resume Exam'}
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>

                  <button
                    type="button"
                    onClick={() => handleDelete(s.id)}
                    aria-label={`Delete session ${s.title}`}
                    className="rounded-xl p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600 cursor-pointer"
                    title="Delete session"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
