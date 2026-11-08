'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Award,
  Clock,
  History,
  Play,
  Trash2,
} from 'lucide-react';
import { deleteSessionById, getAllSessions } from '@/lib/db';
import { calculateExamSummary, formatDuration } from '@/lib/scoring';
import { ExamSession } from '@/types/mcq';

export default function ResultsHistoryPage() {
  const [sessions, setSessions] = useState<ExamSession[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const list = await getAllSessions();
      setSessions(list);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

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
            Review past exam scorecards, section-wise syllabus accuracy, and explanations, or resume
            an unfinished session.
          </p>
        </div>
        <Link
          href="/generator"
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
        >
          <Play className="h-4 w-4 fill-current" />
          New Exam
        </Link>
      </div>

      {loading ? (
        <div className="py-16 text-center text-sm text-slate-500">Loading exam history...</div>
      ) : sessions.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center space-y-4">
          <History className="mx-auto h-10 w-10 text-slate-400" />
          <h2 className="text-lg font-bold text-slate-900">No Exam Sessions Yet</h2>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            Generate your first chapter-wise or mock exam to track scores, accuracy, and mistakes.
          </p>
          <Link
            href="/generator"
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white"
          >
            Open Question Generator
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
                        In Progress ({summary.attempted}/{summary.totalQuestions} Locked)
                      </span>
                    )}

                    <span className="text-xs text-slate-400">
                      {new Date(s.completedAt ?? s.createdAt).toLocaleString()}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900">{s.title}</h3>
                  <p className="text-xs text-slate-600">
                    Sections: {s.config.selectedSections.join(', ')} • Correct:{' '}
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

